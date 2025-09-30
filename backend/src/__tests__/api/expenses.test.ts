import request from 'supertest';
import { Application } from 'express';
import { createTestApp } from '../utils/testServer';
import { setupTestDb, cleanupTestDb, seedTestData } from '../utils/testDb';
import { validExpenseData, invalidExpenseData, multipleExpenses, trendTestData } from '../fixtures/testData';
import { ExpenseCategory } from '../../types/expense';
import { HttpStatus } from '../../types/api';

describe('Expense API Endpoints', () => {
  let app: Application;

  beforeAll(async () => {
    app = createTestApp();
    await setupTestDb();
  });

  afterAll(async () => {
    await cleanupTestDb();
  });

  beforeEach(async () => {
    // Clean up before each test
    const { getTestDb } = await import('../utils/testDb');
    const prisma = getTestDb();
    await prisma.cost.deleteMany({});
  });

  describe('POST /api/expenses', () => {
    it('should create a new expense with valid data', async () => {
      const response = await request(app)
        .post('/api/expenses')
        .send(validExpenseData)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
      expect(response.body.category).toBe(validExpenseData.category);
      expect(response.body.amount).toBe(validExpenseData.amount);
      expect(response.body.month).toBe(validExpenseData.month);
      expect(response.body.year).toBe(validExpenseData.year);
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/expenses')
        .send(invalidExpenseData[0])
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for negative amount', async () => {
      const response = await request(app)
        .post('/api/expenses')
        .send(invalidExpenseData[1])
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.message).toContain('amount');
    });

    it('should return 400 for invalid month', async () => {
      const response = await request(app)
        .post('/api/expenses')
        .send(invalidExpenseData[2])
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.message).toContain('month');
    });

    it('should return 400 for invalid year', async () => {
      const response = await request(app)
        .post('/api/expenses')
        .send(invalidExpenseData[3])
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.message).toContain('year');
    });

    it('should prevent duplicate entries for same category, month, and year', async () => {
      // Create first expense
      await request(app)
        .post('/api/expenses')
        .send(validExpenseData)
        .expect(HttpStatus.CREATED);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/expenses')
        .send(validExpenseData)
        .expect(HttpStatus.CONFLICT);

      expect(response.body.error.code).toBe('DUPLICATE_ENTRY');
    });

    it('should sanitize input data', async () => {
      const maliciousData = {
        ...validExpenseData,
        category: '<script>alert("xss")</script>' + ExpenseCategory.SOFTWARE_TOOLS
      };

      const response = await request(app)
        .post('/api/expenses')
        .send(maliciousData)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/expenses', () => {
    beforeEach(async () => {
      await seedTestData(multipleExpenses);
    });

    it('should return all expenses when no filters applied', async () => {
      const response = await request(app)
        .get('/api/expenses')
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(multipleExpenses.length);
    });

    it('should filter expenses by year', async () => {
      const response = await request(app)
        .get('/api/expenses?year=2024')
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((expense: any) => {
        expect(expense.year).toBe(2024);
      });
    });

    it('should filter expenses by month', async () => {
      const response = await request(app)
        .get('/api/expenses?month=1')
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((expense: any) => {
        expect(expense.month).toBe(1);
      });
    });

    it('should filter expenses by category', async () => {
      const response = await request(app)
        .get(`/api/expenses?category=${ExpenseCategory.SALARIES}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((expense: any) => {
        expect(expense.category).toBe(ExpenseCategory.SALARIES);
      });
    });

    it('should combine multiple filters', async () => {
      const response = await request(app)
        .get(`/api/expenses?year=2024&month=1&category=${ExpenseCategory.SALARIES}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((expense: any) => {
        expect(expense.year).toBe(2024);
        expect(expense.month).toBe(1);
        expect(expense.category).toBe(ExpenseCategory.SALARIES);
      });
    });

    it('should return empty array when no expenses match filters', async () => {
      const response = await request(app)
        .get('/api/expenses?year=2025')
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });
  });

  describe('GET /api/expenses/:id', () => {
    let createdExpenseId: number;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/expenses')
        .send(validExpenseData);
      createdExpenseId = createResponse.body.id;
    });

    it('should return expense by valid ID', async () => {
      const response = await request(app)
        .get(`/api/expenses/${createdExpenseId}`)
        .expect(HttpStatus.OK);

      expect(response.body.id).toBe(createdExpenseId);
      expect(response.body.category).toBe(validExpenseData.category);
    });

    it('should return 404 for non-existent ID', async () => {
      const response = await request(app)
        .get('/api/expenses/99999')
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/expenses/invalid-id')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /api/expenses/:id', () => {
    let createdExpenseId: number;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/expenses')
        .send(validExpenseData);
      createdExpenseId = createResponse.body.id;
    });

    it('should update expense with valid data', async () => {
      const updateData = { ...validExpenseData, amount: 2000 };
      
      const response = await request(app)
        .put(`/api/expenses/${createdExpenseId}`)
        .send(updateData)
        .expect(HttpStatus.OK);

      expect(response.body.id).toBe(createdExpenseId);
      expect(response.body.amount).toBe(2000);
      expect(response.body.updatedAt).not.toBe(response.body.createdAt);
    });

    it('should return 404 for non-existent ID', async () => {
      const response = await request(app)
        .put('/api/expenses/99999')
        .send({ amount: 2000 })
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for invalid update data', async () => {
      const response = await request(app)
        .put(`/api/expenses/${createdExpenseId}`)
        .send({ amount: -100 })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should prevent duplicate entries when updating', async () => {
      // Create another expense
      const anotherExpense = {
        ...validExpenseData,
        category: ExpenseCategory.HARDWARE_EQUIPMENT
      };
      await request(app)
        .post('/api/expenses')
        .send(anotherExpense);

      // Try to update first expense to match second
      const response = await request(app)
        .put(`/api/expenses/${createdExpenseId}`)
        .send(anotherExpense)
        .expect(HttpStatus.CONFLICT);

      expect(response.body.error.code).toBe('DUPLICATE_ENTRY');
    });
  });

  describe('DELETE /api/expenses/:id', () => {
    let createdExpenseId: number;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/expenses')
        .send(validExpenseData);
      createdExpenseId = createResponse.body.id;
    });

    it('should delete expense by valid ID', async () => {
      await request(app)
        .delete(`/api/expenses/${createdExpenseId}`)
        .expect(HttpStatus.NO_CONTENT);

      // Verify expense is deleted
      await request(app)
        .get(`/api/expenses/${createdExpenseId}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 404 for non-existent ID', async () => {
      const response = await request(app)
        .delete('/api/expenses/99999')
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .delete('/api/expenses/invalid-id')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/expenses/trends', () => {
    beforeEach(async () => {
      await seedTestData(trendTestData);
    });

    it('should return trend data for all months', async () => {
      const response = await request(app)
        .get('/api/expenses/trends')
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      response.body.forEach((trend: any) => {
        expect(trend).toHaveProperty('month');
        expect(trend).toHaveProperty('year');
        expect(trend).toHaveProperty('totalAmount');
        expect(trend).toHaveProperty('categoryBreakdown');
        expect(Array.isArray(trend.categoryBreakdown)).toBe(true);
      });
    });

    it('should filter trend data by year', async () => {
      const response = await request(app)
        .get('/api/expenses/trends?year=2024')
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((trend: any) => {
        expect(trend.year).toBe(2024);
      });
    });

    it('should return empty array when no data matches filters', async () => {
      const response = await request(app)
        .get('/api/expenses/trends?year=2025')
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    it('should calculate correct totals and breakdowns', async () => {
      const response = await request(app)
        .get('/api/expenses/trends?year=2024&month=1')
        .expect(HttpStatus.OK);

      expect(response.body).toHaveLength(1);
      const trend = response.body[0];
      
      // Should have correct total (50000 + 2000 = 52000)
      expect(trend.totalAmount).toBe(52000);
      
      // Should have breakdown for both categories
      expect(trend.categoryBreakdown).toHaveLength(2);
      
      const salariesBreakdown = trend.categoryBreakdown.find(
        (item: any) => item.category === ExpenseCategory.SALARIES
      );
      const softwareBreakdown = trend.categoryBreakdown.find(
        (item: any) => item.category === ExpenseCategory.SOFTWARE_TOOLS
      );
      
      expect(salariesBreakdown.amount).toBe(50000);
      expect(softwareBreakdown.amount).toBe(2000);
    });
  });
});