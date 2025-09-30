#!/usr/bin/env ts-node

/**
 * Health check script for database optimizations
 * Verifies that all optimization components are working correctly
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../src/utils/logger';
import { queryMonitor } from '../src/middleware/queryMonitoring';
import { ArchiveService } from '../src/services/archiveService';

const prisma = new PrismaClient();

interface HealthCheckResult {
  component: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: any;
}

async function checkDatabaseConnection(): Promise<HealthCheckResult> {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    return {
      component: 'Database Connection',
      status: 'PASS',
      message: 'Database connection successful'
    };
  } catch (error) {
    return {
      component: 'Database Connection',
      status: 'FAIL',
      message: 'Failed to connect to database',
      details: error
    };
  }
}

async function checkPerformanceIndexes(): Promise<HealthCheckResult> {
  try {
    const indexes = await prisma.$queryRaw`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'costs' 
      AND indexname LIKE 'idx_costs_%'
    ` as any[];

    const expectedIndexes = [
      'idx_costs_year_month',
      'idx_costs_category',
      'idx_costs_created_at',
      'idx_costs_updated_at',
      'idx_costs_year_month_category',
      'idx_costs_amount',
      'idx_costs_year_category'
    ];

    const existingIndexNames = indexes.map(idx => idx.indexname);
    const missingIndexes = expectedIndexes.filter(name => !existingIndexNames.includes(name));

    if (missingIndexes.length === 0) {
      return {
        component: 'Performance Indexes',
        status: 'PASS',
        message: 'All performance indexes are present',
        details: { indexCount: existingIndexNames.length }
      };
    } else {
      return {
        component: 'Performance Indexes',
        status: 'WARN',
        message: 'Some performance indexes are missing',
        details: { missing: missingIndexes, existing: existingIndexNames }
      };
    }
  } catch (error) {
    return {
      component: 'Performance Indexes',
      status: 'FAIL',
      message: 'Failed to check performance indexes',
      details: error
    };
  }
}

async function checkQueryMonitoring(): Promise<HealthCheckResult> {
  try {
    // Reset metrics for clean test
    queryMonitor.resetMetrics();
    
    // Perform a test query to generate metrics
    await prisma.cost.count();
    
    const metrics = queryMonitor.getMetrics();
    
    if (metrics.totalQueries > 0) {
      return {
        component: 'Query Monitoring',
        status: 'PASS',
        message: 'Query monitoring is working',
        details: {
          totalQueries: metrics.totalQueries,
          averageQueryTime: metrics.averageQueryTime
        }
      };
    } else {
      return {
        component: 'Query Monitoring',
        status: 'FAIL',
        message: 'Query monitoring is not recording metrics'
      };
    }
  } catch (error) {
    return {
      component: 'Query Monitoring',
      status: 'FAIL',
      message: 'Query monitoring check failed',
      details: error
    };
  }
}

async function checkArchiveService(): Promise<HealthCheckResult> {
  try {
    // Test archive statistics (this will create the archive table if it doesn't exist)
    const stats = await ArchiveService.getArchiveStats();
    
    return {
      component: 'Archive Service',
      status: 'PASS',
      message: 'Archive service is working',
      details: {
        totalArchivedRecords: stats.totalArchivedRecords,
        sizeEstimate: stats.sizeEstimate
      }
    };
  } catch (error) {
    return {
      component: 'Archive Service',
      status: 'FAIL',
      message: 'Archive service check failed',
      details: error
    };
  }
}

async function checkConnectionPooling(): Promise<HealthCheckResult> {
  try {
    const startTime = Date.now();
    const promises = [];
    
    // Test with 5 concurrent connections
    for (let i = 0; i < 5; i++) {
      promises.push(prisma.cost.count());
    }
    
    const results = await Promise.all(promises);
    const duration = Date.now() - startTime;
    
    if (results.every(r => typeof r === 'number') && duration < 2000) {
      return {
        component: 'Connection Pooling',
        status: 'PASS',
        message: 'Connection pooling is working efficiently',
        details: {
          concurrentQueries: 5,
          totalDuration: duration,
          averagePerQuery: Math.round(duration / 5)
        }
      };
    } else {
      return {
        component: 'Connection Pooling',
        status: 'WARN',
        message: 'Connection pooling may have performance issues',
        details: { duration, results: results.length }
      };
    }
  } catch (error) {
    return {
      component: 'Connection Pooling',
      status: 'FAIL',
      message: 'Connection pooling check failed',
      details: error
    };
  }
}

async function checkEnvironmentConfiguration(): Promise<HealthCheckResult> {
  const requiredEnvVars = [
    'DATABASE_URL',
    'DB_CONNECTION_LIMIT',
    'DB_POOL_TIMEOUT',
    'DB_QUERY_TIMEOUT',
    'DATA_RETENTION_YEARS',
    'ARCHIVE_BATCH_SIZE'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  const configuredVars = requiredEnvVars.filter(varName => process.env[varName]);

  if (missingVars.length === 0) {
    return {
      component: 'Environment Configuration',
      status: 'PASS',
      message: 'All required environment variables are configured',
      details: {
        configuredVariables: configuredVars.length,
        totalRequired: requiredEnvVars.length
      }
    };
  } else {
    return {
      component: 'Environment Configuration',
      status: 'WARN',
      message: 'Some environment variables are using defaults',
      details: {
        missing: missingVars,
        configured: configuredVars
      }
    };
  }
}

async function runHealthChecks(): Promise<void> {
  logger.info('Starting database optimization health checks...');
  
  const checks = [
    checkDatabaseConnection,
    checkEnvironmentConfiguration,
    checkPerformanceIndexes,
    checkQueryMonitoring,
    checkConnectionPooling,
    checkArchiveService
  ];

  const results: HealthCheckResult[] = [];

  for (const check of checks) {
    try {
      const result = await check();
      results.push(result);
      
      const statusIcon = result.status === 'PASS' ? '✓' : result.status === 'WARN' ? '⚠' : '✗';
      logger.info(`${statusIcon} ${result.component}: ${result.message}`);
      
      if (result.details && (result.status === 'FAIL' || result.status === 'WARN')) {
        logger.info(`  Details: ${JSON.stringify(result.details, null, 2)}`);
      }
    } catch (error) {
      results.push({
        component: check.name,
        status: 'FAIL',
        message: 'Health check threw an exception',
        details: error
      });
      logger.error(`✗ ${check.name}: Health check failed with exception`, error);
    }
  }

  // Summary
  const passed = results.filter(r => r.status === 'PASS').length;
  const warned = results.filter(r => r.status === 'WARN').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const total = results.length;

  logger.info('\n=== Health Check Summary ===');
  logger.info(`Total checks: ${total}`);
  logger.info(`Passed: ${passed}`);
  logger.info(`Warnings: ${warned}`);
  logger.info(`Failed: ${failed}`);

  if (failed === 0) {
    logger.info('🎉 All critical health checks passed!');
    if (warned > 0) {
      logger.info('⚠️  Some warnings detected - review configuration');
    }
  } else {
    logger.error('❌ Some health checks failed - immediate attention required');
  }

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run health checks
if (require.main === module) {
  runHealthChecks()
    .catch(error => {
      logger.error('Health check suite failed:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}

export { runHealthChecks };