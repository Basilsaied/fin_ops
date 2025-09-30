import cron from 'node-cron';
import { ArchiveService } from '../services/archiveService';
import { logger } from '../utils/logger';
import { queryMonitor } from '../middleware/queryMonitoring';

export class ScheduledTasks {
  private static tasks: cron.ScheduledTask[] = [];

  // Initialize all scheduled tasks
  static initialize() {
    logger.info('Initializing scheduled tasks...');

    // Archive old data monthly (1st day of month at 2 AM)
    const archiveTask = cron.schedule('0 2 1 * *', async () => {
      logger.info('Starting scheduled data archival...');
      try {
        const result = await ArchiveService.archiveOldData({
          retentionYears: parseInt(process.env.DATA_RETENTION_YEARS || '10'),
          batchSize: parseInt(process.env.ARCHIVE_BATCH_SIZE || '1000')
        });
        
        logger.info('Scheduled archival completed:', result);
      } catch (error) {
        logger.error('Scheduled archival failed:', error);
      }
    }, {
      scheduled: false, // Don't start immediately
      timezone: process.env.TZ || 'UTC'
    });

    // Performance metrics reset weekly (Sunday at midnight)
    const metricsResetTask = cron.schedule('0 0 * * 0', () => {
      logger.info('Resetting performance metrics...');
      queryMonitor.resetMetrics();
      logger.info('Performance metrics reset completed');
    }, {
      scheduled: false,
      timezone: process.env.TZ || 'UTC'
    });

    // Database maintenance monthly (15th day at 3 AM)
    const maintenanceTask = cron.schedule('0 3 15 * *', async () => {
      logger.info('Starting database maintenance...');
      try {
        // Get archive statistics
        const stats = await ArchiveService.getArchiveStats();
        logger.info('Archive statistics:', stats);

        // Clean up very old archives if configured
        if (process.env.CLEANUP_OLD_ARCHIVES === 'true') {
          const maxArchiveYears = parseInt(process.env.MAX_ARCHIVE_YEARS || '20');
          const cleanedCount = await ArchiveService.cleanupOldArchives('costs_archive', maxArchiveYears);
          logger.info(`Cleaned up ${cleanedCount} very old archived records`);
        }

        logger.info('Database maintenance completed');
      } catch (error) {
        logger.error('Database maintenance failed:', error);
      }
    }, {
      scheduled: false,
      timezone: process.env.TZ || 'UTC'
    });

    this.tasks = [archiveTask, metricsResetTask, maintenanceTask];

    // Start tasks only in production or if explicitly enabled
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_SCHEDULED_TASKS === 'true') {
      this.startAll();
      logger.info('Scheduled tasks started');
    } else {
      logger.info('Scheduled tasks initialized but not started (development mode)');
    }
  }

  // Start all tasks
  static startAll() {
    this.tasks.forEach(task => task.start());
  }

  // Stop all tasks
  static stopAll() {
    this.tasks.forEach(task => task.stop());
    logger.info('All scheduled tasks stopped');
  }

  // Get task status
  static getStatus() {
    return {
      totalTasks: this.tasks.length,
      runningTasks: this.tasks.filter(task => task.getStatus() === 'scheduled').length,
      environment: process.env.NODE_ENV,
      scheduledTasksEnabled: process.env.ENABLE_SCHEDULED_TASKS === 'true' || process.env.NODE_ENV === 'production'
    };
  }

  // Manual trigger for archival (for testing or manual execution)
  static async triggerArchival(retentionYears?: number) {
    logger.info('Manually triggering data archival...');
    try {
      const result = await ArchiveService.archiveOldData({
        retentionYears: retentionYears || parseInt(process.env.DATA_RETENTION_YEARS || '10'),
        batchSize: parseInt(process.env.ARCHIVE_BATCH_SIZE || '1000')
      });
      
      logger.info('Manual archival completed:', result);
      return result;
    } catch (error) {
      logger.error('Manual archival failed:', error);
      throw error;
    }
  }

  // Manual trigger for maintenance
  static async triggerMaintenance() {
    logger.info('Manually triggering database maintenance...');
    try {
      const stats = await ArchiveService.getArchiveStats();
      logger.info('Archive statistics:', stats);

      if (process.env.CLEANUP_OLD_ARCHIVES === 'true') {
        const maxArchiveYears = parseInt(process.env.MAX_ARCHIVE_YEARS || '20');
        const cleanedCount = await ArchiveService.cleanupOldArchives('costs_archive', maxArchiveYears);
        logger.info(`Cleaned up ${cleanedCount} very old archived records`);
        return { stats, cleanedCount };
      }

      return { stats, cleanedCount: 0 };
    } catch (error) {
      logger.error('Manual maintenance failed:', error);
      throw error;
    }
  }
}

// Graceful shutdown handler
process.on('SIGINT', () => {
  logger.info('Received SIGINT, stopping scheduled tasks...');
  ScheduledTasks.stopAll();
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, stopping scheduled tasks...');
  ScheduledTasks.stopAll();
});