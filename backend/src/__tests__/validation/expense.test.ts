import { 
  createExpenseSchema, 
  updateExpenseSchema, 
  expenseQuerySchema,
  trendsQuerySchema 
} from '../../validation/expense';
import { ExpenseCategory } from '../../types/expense';

describe('Expense Validation Schemas', () => {
  describe('createExpenseSchema', () => {
    const validData = {
      category: ExpenseCategory.SOFTWARE_TOOLS,
      amount: 1500.50,
      month: 3,
      year: 2024
    };

    it('should validate correct expense data', () => {
      const { error, value } = createExpenseSchema.validate(validData);
      
      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    it('should require category field', () => {
      const { category, ...dataWithoutCategory } = validData;
      const { error } = createExpenseSchema.validate(dataWithoutCategory);
      
      expect(error).toBeDefined();
      expect(error!.details[0].path).toContain('category');
    });

    it('should require amount field', () => {
      const { amount, ...dataWithoutAmount } = validData;
      const { error } = createExpenseSchema.validate(dataWithoutAmount);
      
      expect(error).toBeDefined();
      expect(error!.details[0].path).toContain('amount');
    });

    it('should require month field', () => {
      const { month, ...dataWithoutMonth } = validData;
      const { error } = createExpenseSchema.validate(dataWithoutMonth);
      
      expect(error).toBeDefined();
      expect(error!.details[0].path).toContain('month');
    });

    it('should require year field', () => {
      const { year, ...dataWithoutYear } = validData;
      const { error } = createExpenseSchema.validate(dataWithoutYear);
      
      expect(error).toBeDefined();
      expect(error!.details[0].path).toContain('year');
    });

    it('should reject invalid category', () => {
      const invalidData = { ...validData, category: 'Invalid Category' };
      const { error } = createExpenseSchema.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error!.details[0].path).toContain('category');
    });

    it('should reject negative amount', () => {
      const invalidData = { ...validData, amount: -100 };
      const { error } = createExpenseSchema.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error!.details[0].path).toContain('amount');
    });

    it('should reject zero amount', () => {
      const invalidData = { ...validData, amount: 0 };
      const { error } = createExpenseSchema.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error!.details[0].path).toContain('amount');
    });

    it('should reject month less than 1', () => {
      const invalidData = { ...validData, month: 0 };
      const { error } = createExpenseSchema.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error!.details[0].path).toContain('month');
    });

    it('should reject month greater than 12', () => {
      const invalidData = { ...validData, month: 13 };
      const { error } = createExpenseSchema.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error!.details[0].path).toContain('month');
    });

    it('should reject year less than 2020', () => {
      const invalidData = { ...validData, year: 2019 };
      const { error } = createExpenseSchema.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error!.details[0].path).toContain('year');
    });

    it('should reject year greater than 2050', () => {
      const invalidData = { ...validData, year: 2051 };
      const { error } = createExpenseSchema.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error!.details[0].path).toContain('year');
    });

    it('should accept decimal amounts', () => {
      const decimalData = { ...validData, amount: 1234.56 };
      const { error } = createExpenseSchema.validate(decimalData);
      
      expect(error).toBeUndefined();
    });

    it('should accept all valid categories', () => {
      const categories = Object.values(ExpenseCategory);
      
      categories.forEach(category => {
        const testData = { ...validData, category };
        const { error } = createExpenseSchema.validate(testData);
        
        expect(error).toBeUndefined();
      });
    });

    it('should sanitize string inputs', () => {
      const dataWithExtraSpaces = {
        ...validData,
        category: `  ${ExpenseCategory.SOFTWARE_TOOLS}  `
      };
      const { error, value } = createExpenseSchema.validate(dataWithExtraSpaces);
      
      expect(error).toBeUndefined();
      expect(value.category).toBe(ExpenseCategory.SOFTWARE_TOOLS);
    });
  });

  describe('updateExpenseSchema', () => {
    it('should allow partial updates', () => {
      const partialData = { amount: 2000 };
      const { error } = updateExpenseSchema.validate(partialData);
      
      expect(error).toBeUndefined();
    });

    it('should validate amount when provided', () => {
      const invalidData = { amount: -100 };
      const { error } = updateExpenseSchema.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error!.details[0].path).toContain('amount');
    });

    it('should validate category when provided', () => {
      const invalidData = { category: 'Invalid Category' };
      const { error } = updateExpenseSchema.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error!.details[0].path).toContain('category');
    });

    it('should validate month when provided', () => {
      const invalidData = { month: 13 };
      const { error } = updateExpenseSchema.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error!.details[0].path).toContain('month');
    });

    it('should validate year when provided', () => {
      const invalidData = { year: 2019 };
      const { error } = updateExpenseSchema.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error!.details[0].path).toContain('year');
    });

    it('should allow empty object', () => {
      const { error } = updateExpenseSchema.validate({});
      
      expect(error).toBeUndefined();
    });
  });

  describe('expenseQuerySchema', () => {
    it('should allow empty query', () => {
      const { error } = expenseQuerySchema.validate({});
      
      expect(error).toBeUndefined();
    });

    it('should validate year parameter', () => {
      const validQuery = { year: 2024 };
      const { error } = expenseQuerySchema.validate(validQuery);
      
      expect(error).toBeUndefined();
    });

    it('should validate month parameter', () => {
      const validQuery = { month: 6 };
      const { error } = expenseQuerySchema.validate(validQuery);
      
      expect(error).toBeUndefined();
    });

    it('should validate category parameter', () => {
      const validQuery = { category: ExpenseCategory.SALARIES };
      const { error } = expenseQuerySchema.validate(validQuery);
      
      expect(error).toBeUndefined();
    });

    it('should reject invalid year', () => {
      const invalidQuery = { year: 2019 };
      const { error } = expenseQuerySchema.validate(invalidQuery);
      
      expect(error).toBeDefined();
      expect(error!.details[0].path).toContain('year');
    });

    it('should reject invalid month', () => {
      const invalidQuery = { month: 13 };
      const { error } = expenseQuerySchema.validate(invalidQuery);
      
      expect(error).toBeDefined();
      expect(error!.details[0].path).toContain('month');
    });

    it('should reject invalid category', () => {
      const invalidQuery = { category: 'Invalid Category' };
      const { error } = expenseQuerySchema.validate(invalidQuery);
      
      expect(error).toBeDefined();
      expect(error!.details[0].path).toContain('category');
    });

    it('should convert string numbers to integers', () => {
      const queryWithStrings = { year: '2024', month: '6' };
      const { error, value } = expenseQuerySchema.validate(queryWithStrings);
      
      expect(error).toBeUndefined();
      expect(typeof value.year).toBe('number');
      expect(typeof value.month).toBe('number');
      expect(value.year).toBe(2024);
      expect(value.month).toBe(6);
    });
  });

  describe('trendsQuerySchema', () => {
    it('should allow empty query', () => {
      const { error } = trendsQuerySchema.validate({});
      
      expect(error).toBeUndefined();
    });

    it('should validate year parameter', () => {
      const validQuery = { year: 2024 };
      const { error } = trendsQuerySchema.validate(validQuery);
      
      expect(error).toBeUndefined();
    });

    it('should validate month parameter', () => {
      const validQuery = { month: 6 };
      const { error } = trendsQuerySchema.validate(validQuery);
      
      expect(error).toBeUndefined();
    });

    it('should reject invalid parameters', () => {
      const invalidQuery = { year: 2019, month: 13 };
      const { error } = trendsQuerySchema.validate(invalidQuery);
      
      expect(error).toBeDefined();
    });

    it('should convert string numbers to integers', () => {
      const queryWithStrings = { year: '2024', month: '6' };
      const { error, value } = trendsQuerySchema.validate(queryWithStrings);
      
      expect(error).toBeUndefined();
      expect(typeof value.year).toBe('number');
      expect(typeof value.month).toBe('number');
    });
  });

  describe('Input Sanitization', () => {
    it('should handle XSS attempts in category', () => {
      const maliciousData = {
        category: '<script>alert("xss")</script>',
        amount: 1500,
        month: 3,
        year: 2024
      };
      
      const { error } = createExpenseSchema.validate(maliciousData);
      
      expect(error).toBeDefined();
      expect(error!.details[0].path).toContain('category');
    });

    it('should handle SQL injection attempts', () => {
      const maliciousData = {
        category: "'; DROP TABLE costs; --",
        amount: 1500,
        month: 3,
        year: 2024
      };
      
      const { error } = createExpenseSchema.validate(maliciousData);
      
      expect(error).toBeDefined();
      expect(error!.details[0].path).toContain('category');
    });

    it('should handle extremely large numbers', () => {
      const dataWithLargeAmount = {
        category: ExpenseCategory.SOFTWARE_TOOLS,
        amount: Number.MAX_SAFE_INTEGER + 1,
        month: 3,
        year: 2024
      };
      
      const { error } = createExpenseSchema.validate(dataWithLargeAmount);
      
      expect(error).toBeDefined();
      expect(error!.details[0].path).toContain('amount');
    });

    it('should handle non-numeric strings for numbers', () => {
      const invalidData = {
        category: ExpenseCategory.SOFTWARE_TOOLS,
        amount: 'not-a-number',
        month: 3,
        year: 2024
      };
      
      const { error } = createExpenseSchema.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error!.details[0].path).toContain('amount');
    });
  });
});