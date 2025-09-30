#!/usr/bin/env ts-node

/**
 * Performance testing script for database optimizations
 * Run with: npx ts-node scripts/test-performance.ts
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

interface PerformanceTest {
  name: string;
  query: () => Promise<any>;
  expectedMaxTime: number; // milliseconds
}

const performanceTests: PerformanceTest[] = [
  {
    name: 'Query by year and month (should use idx_costs_year_month)',
    query: () => prisma.cost.findMany({
      where: {
        year: 2024,
        month: 1
      }
    }),
    expectedMaxTime: 100
  },
  {
    name: 'Query by category (should use idx_costs_category)',
    query: () => prisma.cost.findMany({
      where: {
        category: 'SALARIES'
      }
    }),
    expectedMaxTime: 100
  },
  {
    name: 'Complex trend query (should use idx_costs_year_month_category)',
    query: () => prisma.cost.findMany({
      where: {
        year: { gte: 2023 },
        month: { gte: 1 },
        category: 'SOFTWARE_TOOLS'
      },
      orderBy: [
        { year: 'asc' },
        { month: 'asc' }
      ]
    }),
    expectedMaxTime: 150
  },
  {
    name: 'Amount range query (should use idx_costs_amount)',
    query: () => prisma.cost.findMany({
      where: {
        amount: {
          gte: 1000,
          lte: 10000
        }
      }
    }),
    expectedMaxTime: 100
  },
  {
    name: 'Date range query (should use idx_costs_created_at)',
    query: () => prisma.cost.findMany({
      where: {
        createdAt: {
          gte: new Date('2024-01-01'),
          lte: new Date('2024-12-31')
        }
      }
    }),
    expectedMaxTime: 100
  }
];

async function runPerformanceTest(test: PerformanceTest): Promise<{
  name: string;
  duration: number;
  passed: boolean;
  resultCount: number;
}> {
  const startTime = Date.now();
  
  try {
    const result = await test.query();
    const duration = Date.now() - startTime;
    const passed = duration <= test.expectedMaxTime;
    
    return {
      name: test.name,
      duration,
      passed,
      resultCount: Array.isArray(result) ? result.length : 1
    };
  } catch (error) {
    logger.error(`Test failed: ${test.name}`, error);
    return {
      name: test.name,
      duration: Date.now() - startTime,
      passed: false,
      resultCount: 0
    };
  }
}

async function checkIndexes(): Promise<void> {
  try {
    const indexes = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE tablename = 'costs'
      ORDER BY indexname;
    ` as any[];

    logger.info('Database indexes for costs table:');
    indexes.forEach(index => {
      logger.info(`  - ${index.indexname}: ${index.indexdef}`);
    });
    
    // Check if our performance indexes exist
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
    
    if (missingIndexes.length > 0) {
      logger.warn('Missing performance indexes:', missingIndexes);
      logger.info('Run the SQL script: scripts/apply-indexes.sql to create missing indexes');
    } else {
      logger.info('All performance indexes are present ✓');
    }
  } catch (error) {
    logger.error('Failed to check indexes:', error);
  }
}

async function testConnectionPooling(): Promise<void> {
  logger.info('Testing connection pooling...');
  
  const startTime = Date.now();
  const promises = [];
  
  // Create 20 concurrent queries to test connection pooling
  for (let i = 0; i < 20; i++) {
    promises.push(
      prisma.cost.count().catch(err => {
        logger.error(`Concurrent query ${i} failed:`, err);
        return 0;
      })
    );
  }
  
  try {
    const results = await Promise.all(promises);
    const duration = Date.now() - startTime;
    const successCount = results.filter(r => r >= 0).length;
    
    logger.info(`Connection pooling test completed:`);
    logger.info(`  - Duration: ${duration}ms`);
    logger.info(`  - Successful queries: ${successCount}/20`);
    logger.info(`  - Average time per query: ${Math.round(duration / 20)}ms`);
    
    if (successCount === 20 && duration < 5000) {
      logger.info('Connection pooling test PASSED ✓');
    } else {
      logger.warn('Connection pooling test may have issues');
    }
  } catch (error) {
    logger.error('Connection pooling test failed:', error);
  }
}

async function main(): Promise<void> {
  logger.info('Starting database performance tests...');
  
  try {
    // Connect to database
    await prisma.$connect();
    logger.info('Connected to database');
    
    // Check indexes
    await checkIndexes();
    
    // Test connection pooling
    await testConnectionPooling();
    
    // Run performance tests
    logger.info('\nRunning query performance tests...');
    const results = [];
    
    for (const test of performanceTests) {
      const result = await runPerformanceTest(test);
      results.push(result);
      
      const status = result.passed ? '✓ PASS' : '✗ FAIL';
      logger.info(`${status} ${result.name}`);
      logger.info(`  Duration: ${result.duration}ms (max: ${test.expectedMaxTime}ms)`);
      logger.info(`  Results: ${result.resultCount} records`);
    }
    
    // Summary
    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;
    const averageTime = Math.round(results.reduce((sum, r) => sum + r.duration, 0) / totalTests);
    
    logger.info('\n=== Performance Test Summary ===');
    logger.info(`Tests passed: ${passedTests}/${totalTests}`);
    logger.info(`Average query time: ${averageTime}ms`);
    
    if (passedTests === totalTests) {
      logger.info('All performance tests PASSED ✓');
    } else {
      logger.warn('Some performance tests FAILED - consider optimizing queries or adding indexes');
    }
    
  } catch (error) {
    logger.error('Performance test suite failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the tests
if (require.main === module) {
  main().catch(console.error);
}

export { main as runPerformanceTests };