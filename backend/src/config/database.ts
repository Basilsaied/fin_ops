import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { queryMonitor } from '../middleware/queryMonitoring';

declare global {
  var __prisma: PrismaClient | undefined;
}

// Prevent multiple instances of Prisma Client in development
const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pooling configuration
  __internal: {
    engine: {
      // Connection pool settings
      connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
      poolTimeout: parseInt(process.env.DB_POOL_TIMEOUT || '10000'), // 10 seconds
      // Query timeout
      queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'), // 30 seconds
    },
  },
});

if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma;
}

// Add query monitoring middleware
prisma.$use(async (params, next) => {
  const startTime = Date.now();
  const result = await next(params);
  const duration = Date.now() - startTime;
  
  // Record query performance
  queryMonitor.recordQuery(duration, `${params.model}.${params.action}`);
  
  return result;
});

// Test database connection
export const connectDatabase = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    process.exit(1);
  }
};

// Graceful shutdown
export const disconnectDatabase = async () => {
  await prisma.$disconnect();
  logger.info('Database disconnected');
};

export { prisma };