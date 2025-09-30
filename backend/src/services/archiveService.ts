import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { Prisma } from '@prisma/client';

export interface ArchiveConfig {
  retentionYears: number; // How many years to keep in main table
  archiveTableName: string;
  batchSize: number; // Number of records to process at once
}

export class ArchiveService {
  private static readonly DEFAULT_CONFIG: ArchiveConfig = {
    retentionYears: 10,
    archiveTableName: 'costs_archive',
    batchSize: 1000
  };

  // Archive old data based on retention policy
  static async archiveOldData(config: Partial<ArchiveConfig> = {}): Promise<{
    archivedCount: number;
    deletedCount: number;
    cutoffDate: Date;
  }> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - finalConfig.retentionYears);

    logger.info(`Starting data archival process. Cutoff date: ${cutoffDate.toISOString()}`);

    try {
      // First, ensure archive table exists
      await this.ensureArchiveTableExists(finalConfig.archiveTableName);

      // Get count of records to archive
      const recordsToArchive = await prisma.cost.count({
        where: {
          createdAt: {
            lt: cutoffDate
          }
        }
      });

      if (recordsToArchive === 0) {
        logger.info('No records found for archival');
        return {
          archivedCount: 0,
          deletedCount: 0,
          cutoffDate
        };
      }

      logger.info(`Found ${recordsToArchive} records to archive`);

      let archivedCount = 0;
      let offset = 0;

      // Process records in batches
      while (offset < recordsToArchive) {
        const batch = await prisma.cost.findMany({
          where: {
            createdAt: {
              lt: cutoffDate
            }
          },
          take: finalConfig.batchSize,
          skip: offset,
          orderBy: {
            createdAt: 'asc'
          }
        });

        if (batch.length === 0) break;

        // Archive the batch
        await this.archiveBatch(batch, finalConfig.archiveTableName);
        archivedCount += batch.length;
        offset += finalConfig.batchSize;

        logger.debug(`Archived batch: ${batch.length} records (total: ${archivedCount})`);
      }

      // Delete archived records from main table
      const deleteResult = await prisma.cost.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          }
        }
      });

      logger.info(`Archival complete. Archived: ${archivedCount}, Deleted: ${deleteResult.count}`);

      return {
        archivedCount,
        deletedCount: deleteResult.count,
        cutoffDate
      };
    } catch (error) {
      logger.error('Error during data archival:', error);
      throw error;
    }
  }

  // Ensure archive table exists with same structure as main table
  private static async ensureArchiveTableExists(tableName: string): Promise<void> {
    try {
      // Create archive table if it doesn't exist
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS ${tableName} (
          id SERIAL PRIMARY KEY,
          category TEXT NOT NULL,
          amount DECIMAL(12,2) NOT NULL,
          month SMALLINT NOT NULL,
          year SMALLINT NOT NULL,
          created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          archived_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indexes on archive table for performance
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_${tableName}_year_month 
        ON ${tableName}(year, month)
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_${tableName}_category 
        ON ${tableName}(category)
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_${tableName}_archived_at 
        ON ${tableName}(archived_at)
      `);

      logger.debug(`Archive table ${tableName} ready`);
    } catch (error) {
      logger.error(`Error creating archive table ${tableName}:`, error);
      throw error;
    }
  }

  // Archive a batch of records
  private static async archiveBatch(records: any[], tableName: string): Promise<void> {
    if (records.length === 0) return;

    try {
      // Build insert query
      const values = records.map(record => 
        `(${record.id}, '${record.category}', ${record.amount}, ${record.month}, ${record.year}, '${record.createdAt.toISOString()}', '${record.updatedAt.toISOString()}', CURRENT_TIMESTAMP)`
      ).join(', ');

      const query = `
        INSERT INTO ${tableName} (id, category, amount, month, year, created_at, updated_at, archived_at)
        VALUES ${values}
        ON CONFLICT (id) DO NOTHING
      `;

      await prisma.$executeRawUnsafe(query);
    } catch (error) {
      logger.error('Error archiving batch:', error);
      throw error;
    }
  }

  // Get archive statistics
  static async getArchiveStats(tableName: string = 'costs_archive'): Promise<{
    totalArchivedRecords: number;
    oldestRecord: Date | null;
    newestRecord: Date | null;
    sizeEstimate: string;
  }> {
    try {
      // Check if archive table exists
      const tableExists = await prisma.$queryRawUnsafe(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = '${tableName}'
        )
      `) as any[];

      if (!tableExists[0]?.exists) {
        return {
          totalArchivedRecords: 0,
          oldestRecord: null,
          newestRecord: null,
          sizeEstimate: '0 MB'
        };
      }

      // Get record count
      const countResult = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*) as count FROM ${tableName}
      `) as any[];

      const totalArchivedRecords = parseInt(countResult[0]?.count || '0');

      // Get date range
      const dateRangeResult = await prisma.$queryRawUnsafe(`
        SELECT 
          MIN(created_at) as oldest,
          MAX(created_at) as newest
        FROM ${tableName}
      `) as any[];

      // Get table size estimate
      const sizeResult = await prisma.$queryRawUnsafe(`
        SELECT pg_size_pretty(pg_total_relation_size('${tableName}')) as size
      `) as any[];

      return {
        totalArchivedRecords,
        oldestRecord: dateRangeResult[0]?.oldest || null,
        newestRecord: dateRangeResult[0]?.newest || null,
        sizeEstimate: sizeResult[0]?.size || '0 MB'
      };
    } catch (error) {
      logger.error('Error getting archive stats:', error);
      throw error;
    }
  }

  // Clean up very old archived data (optional)
  static async cleanupOldArchives(
    tableName: string = 'costs_archive',
    maxArchiveYears: number = 20
  ): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - maxArchiveYears);

    try {
      const result = await prisma.$executeRawUnsafe(`
        DELETE FROM ${tableName} 
        WHERE created_at < '${cutoffDate.toISOString()}'
      `) as any;

      const deletedCount = result.count || 0;
      logger.info(`Cleaned up ${deletedCount} old archived records older than ${cutoffDate.toISOString()}`);

      return deletedCount;
    } catch (error) {
      logger.error('Error cleaning up old archives:', error);
      throw error;
    }
  }

  // Restore data from archive (if needed)
  static async restoreFromArchive(
    startDate: Date,
    endDate: Date,
    tableName: string = 'costs_archive'
  ): Promise<number> {
    try {
      // Get records from archive
      const records = await prisma.$queryRawUnsafe(`
        SELECT id, category, amount, month, year, created_at, updated_at
        FROM ${tableName}
        WHERE created_at >= '${startDate.toISOString()}'
        AND created_at <= '${endDate.toISOString()}'
      `) as any[];

      if (records.length === 0) {
        logger.info('No records found in archive for the specified date range');
        return 0;
      }

      // Restore records to main table
      for (const record of records) {
        await prisma.cost.upsert({
          where: { id: record.id },
          update: {
            category: record.category,
            amount: record.amount,
            month: record.month,
            year: record.year,
            updatedAt: new Date()
          },
          create: {
            id: record.id,
            category: record.category,
            amount: record.amount,
            month: record.month,
            year: record.year,
            createdAt: record.created_at,
            updatedAt: record.updated_at
          }
        });
      }

      logger.info(`Restored ${records.length} records from archive`);
      return records.length;
    } catch (error) {
      logger.error('Error restoring from archive:', error);
      throw error;
    }
  }
}