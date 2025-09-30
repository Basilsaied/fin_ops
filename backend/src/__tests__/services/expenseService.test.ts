import { ExpenseService } from '../../services/expenseService';
import { setupTestDb, cleanupTestDb, seedTestData, getTestDb } from '../utils/testDb';
import { validExpenseData, multipleExpenses, trendTestData } from '../fixtures/testData';
import { ExpenseCategory } from '../../types/expense';
import { ApiError } from '../../utils/errors';

describe('ExpenseService', () => {
  let expenseService: ExpenseService;

  beforeAll(async () => {
    await setupTestDb();
    expenseService = new ExpenseService();
  });

  afterAll(async () => {
    await cleanupTestDb();
  });

  beforeEach(async () => {
    const prisma = getTestDb();
    await prisma.cost.deleteMany({});
  });

  describe('createExpense', () => {
    it('should create expense with valid data', async () => {
      const result = await expenseService.createExpense(validExpenseData);

      expect(result).toHaveProperty('id');
      expect(result.category).toBe(validExpenseData.category);
      expect(result.amount).toBe(validExpenseData.amount);
      expect(result.month).toBe(validExpenseData.month);
      expect(result.year).toBe(validExpenseData.year);
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });

    it('should throw error for duplicate entry', async () => {
      await expenseService.createExpense(validExpenseData);

      await expect(expenseService.createExpense(validExpenseData))
        .rejects
        .toThrow(ApiError);
    });

    it('should handle database connection errors', async () => {
      // Mock database error
      const prisma = getTestDb();
      const originalCreate = prisma.cost.create;
      prisma.cost.create = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      await expect(expenseService.createExpense(validExpenseData))
        .rejects
        .toThrow('Database connection failed');

      // Restore original method
      prisma.cost.create = originalCreate;
    });
  });

  describe('getExpenses', () => {
    beforeEach(async () => {
      await seedTestData(multipleExpenses);
    });

    it('should return all expenses when no filters provided', async () => {
      const result = await expenseService.getExpenses({});

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(multipleExpenses.length);
    });

    it('should filter by year', async () => {
      const result = await expenseService.getExpenses({ year: 2024 });

      expect(Array.isArray(result)).toBe(true);
      result.forEach(expense => {
        expect(expense.year).toBe(2024);
      });
    });

    it('should filter by month', async () => {
      const result = await expenseService.getExpenses({ month: 1 });

      expect(Array.isArray(result)).toBe(true);
      result.forEach(expense => {
        expect(expense.month).toBe(1);
      });
    });

    it('should filter by category', async () => {
      const result = await expenseService.getExpenses({ 
        category: ExpenseCategory.SALARIES 
      });

      expect(Array.isArray(result)).toBe(true);
      result.forEach(expense => {
        expect(expense.category).toBe(ExpenseCategory.SALARIES);
      });
    });

    it('should combine multiple filters', async () => {
      const result = await expenseService.getExpenses({
        year: 2024,
        month: 1,
        category: ExpenseCategory.SALARIES
      });

      expect(Array.isArray(result)).toBe(true);
      result.forEach(expense => {
        expect(expense.year).toBe(2024);
        expect(expense.month).toBe(1);
        expect(expense.category).toBe(ExpenseCategory.SALARIES);
      });
    });

    it('should return empty array when no matches found', async () => {
      const result = await expenseService.getExpenses({ year: 2025 });

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });

  describe('getExpenseById', () => {
    let createdExpenseId: number;

    beforeEach(async () => {
      const created = await expenseService.createExpense(validExpenseData);
      createdExpenseId = created.id;
    });

    it('should return expense by valid ID', async () => {
      const result = await expenseService.getExpenseById(createdExpenseId);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(createdExpenseId);
      expect(result!.category).toBe(validExpenseData.category);
    });

    it('should return null for non-existent ID', async () => {
      const result = await expenseService.getExpenseById(99999);

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const prisma = getTestDb();
      const originalFindUnique = prisma.cost.findUnique;
      prisma.cost.findUnique = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(expenseService.getExpenseById(createdExpenseId))
        .rejects
        .toThrow('Database error');

      prisma.cost.findUnique = originalFindUnique;
    });
  });

  describe('updateExpense', () => {
    let createdExpenseId: number;

    beforeEach(async () => {
      const created = await expenseService.createExpense(validExpenseData);
      createdExpenseId = created.id;
    });

    it('should update expense with valid data', async () => {
      const updateData = { amount: 2500 };
      const result = await expenseService.updateExpense(createdExpenseId, updateData);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(createdExpenseId);
      expect(result!.amount).toBe(2500);
      expect(result!.updatedAt).not.toEqual(result!.createdAt);
    });

    it('should return null for non-existent ID', async () => {
      const result = await expenseService.updateExpense(99999, { amount: 2500 });

      expect(result).toBeNull();
    });

    it('should throw error when update would create duplicate', async () => {
      // Create another expense
      const anotherExpense = {
        ...validExpenseData,
        category: ExpenseCategory.HARDWARE_EQUIPMENT
      };
      await expenseService.createExpense(anotherExpense);

      // Try to update first expense to match second
      await expect(
        expenseService.updateExpense(createdExpenseId, anotherExpense)
      ).rejects.toThrow(ApiError);
    });

    it('should allow updating same expense without duplicate error', async () => {
      const result = await expenseService.updateExpense(createdExpenseId, {
        amount: 3000
      });

      expect(result).not.toBeNull();
      expect(result!.amount).toBe(3000);
    });
  });

  describe('deleteExpense', () => {
    let createdExpenseId: number;

    beforeEach(async () => {
      const created = await expenseService.createExpense(validExpenseData);
      createdExpenseId = created.id;
    });

    it('should delete expense by valid ID', async () => {
      const result = await expenseService.deleteExpense(createdExpenseId);

      expect(result).toBe(true);

      // Verify expense is deleted
      const deleted = await expenseService.getExpenseById(createdExpenseId);
      expect(deleted).toBeNull();
    });

    it('should return false for non-existent ID', async () => {
      const result = await expenseService.deleteExpense(99999);

      expect(result).toBe(false);
    });

    it('should handle database errors', async () => {
      const prisma = getTestDb();
      const originalDelete = prisma.cost.delete;
      prisma.cost.delete = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(expenseService.deleteExpense(createdExpenseId))
        .rejects
        .toThrow('Database error');

      prisma.cost.delete = originalDelete;
    });
  });

  describe('getTrends', () => {
    beforeEach(async () => {
      await seedTestData(trendTestData);
    });

    it('should return trend data for all months', async () => {
      const result = await expenseService.getTrends({});

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      result.forEach(trend => {
        expect(trend).toHaveProperty('month');
        expect(trend).toHaveProperty('year');
        expect(trend).toHaveProperty('totalAmount');
        expect(trend).toHaveProperty('categoryBreakdown');
        expect(Array.isArray(trend.categoryBreakdown)).toBe(true);
      });
    });

    it('should filter trends by year', async () => {
      const result = await expenseService.getTrends({ year: 2024 });

      expect(Array.isArray(result)).toBe(true);
      result.forEach(trend => {
        expect(trend.year).toBe(2024);
      });
    });

    it('should calculate correct totals and breakdowns', async () => {
      const result = await expenseService.getTrends({ year: 2024, month: 1 });

      expect(result).toHaveLength(1);
      const trend = result[0];

      // Should have correct total (50000 + 2000 = 52000)
      expect(trend.totalAmount).toBe(52000);

      // Should have breakdown for both categories
      expect(trend.categoryBreakdown).toHaveLength(2);

      const salariesBreakdown = trend.categoryBreakdown.find(
        item => item.category === ExpenseCategory.SALARIES
      );
      const softwareBreakdown = trend.categoryBreakdown.find(
        item => item.category === ExpenseCategory.SOFTWARE_TOOLS
      );

      expect(salariesBreakdown?.amount).toBe(50000);
      expect(softwareBreakdown?.amount).toBe(2000);
    });

    it('should return empty array when no data matches filters', async () => {
      const result = await expenseService.getTrends({ year: 2025 });

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it('should handle database aggregation errors', async () => {
      const prisma = getTestDb();
      const originalGroupBy = prisma.cost.groupBy;
      prisma.cost.groupBy = jest.fn().mockRejectedValue(new Error('Aggregation failed'));

      await expect(expenseService.getTrends({}))
        .rejects
        .toThrow('Aggregation failed');

      prisma.cost.groupBy = originalGroupBy;
    });
  });
});