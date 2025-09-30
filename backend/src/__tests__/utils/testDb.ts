import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

export const setupTestDb = async (): Promise<PrismaClient> => {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
        }
      }
    });
  }
  
  await prisma.$connect();
  return prisma;
};

export const cleanupTestDb = async (): Promise<void> => {
  if (prisma) {
    // Clean up test data
    await prisma.cost.deleteMany({});
    await prisma.$disconnect();
  }
};

export const seedTestData = async (data: any[]): Promise<void> => {
  if (!prisma) {
    throw new Error('Database not initialized. Call setupTestDb first.');
  }
  
  for (const item of data) {
    await prisma.cost.create({
      data: item
    });
  }
};

export const getTestDb = (): PrismaClient => {
  if (!prisma) {
    throw new Error('Database not initialized. Call setupTestDb first.');
  }
  return prisma;
};