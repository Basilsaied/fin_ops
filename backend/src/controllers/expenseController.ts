import { Request, Response, NextFunction } from 'express';
import { ExpenseService } from '../services/expenseService';
import { 
  createExpenseSchema, 
  updateExpenseSchema, 
  expenseQuerySchema, 
  expenseIdSchema,
  trendsQuerySchema 
} from '../validation/expense';
import { 
  CreateExpenseRequest, 
  UpdateExpenseRequest, 
  ExpenseQuery,
  TrendsQuery 
} from '../types/expense';
import { ApiResponse, PaginatedResponse, HttpStatus } from '../types/api';
import { ValidationError, ApiError } from '../utils/errors';
import { logger } from '../utils/logger';

export class ExpenseController {
  // Create a new expense
  static async createExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body
      const { error, value } = createExpenseSchema.validate(req.body);
      if (error) {
        throw new ValidationError(error.details[0]?.message || 'Validation error');
      }

      const expenseData: CreateExpenseRequest = value;
      const expense = await ExpenseService.createExpense(expenseData);

      const response: ApiResponse = {
        data: expense,
        message: 'Expense created successfully',
        timestamp: new Date().toISOString()
      };

      res.status(HttpStatus.CREATED).json(response);
    } catch (error) {
      next(error);
    }
  }

  // Get expenses with optional filtering and pagination
  static async getExpenses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate query parameters
      const { error, value } = expenseQuerySchema.validate(req.query);
      if (error) {
        throw new ValidationError(error.details[0]?.message || 'Validation error');
      }

      const query: ExpenseQuery = value;
      const result = await ExpenseService.getExpenses(query);

      const response: PaginatedResponse<any> = {
        data: result.expenses,
        pagination: {
          total: result.total,
          limit: query.limit || 50,
          offset: query.offset || 0,
          hasMore: (query.offset || 0) + result.expenses.length < result.total
        },
        timestamp: new Date().toISOString()
      };

      res.status(HttpStatus.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  // Get a single expense by ID
  static async getExpenseById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate expense ID parameter
      const { error, value } = expenseIdSchema.validate({ id: parseInt(req.params.id || '0') });
      if (error) {
        throw new ValidationError(error.details[0]?.message || 'Validation error');
      }

      const expense = await ExpenseService.getExpenseById(value.id);

      const response: ApiResponse = {
        data: expense,
        timestamp: new Date().toISOString()
      };

      res.status(HttpStatus.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  // Update an expense
  static async updateExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate expense ID parameter
      const { error: idError, value: idValue } = expenseIdSchema.validate({ 
        id: parseInt(req.params.id || '0') 
      });
      if (idError) {
        throw new ValidationError(idError.details[0]?.message || 'Validation error');
      }

      // Validate request body
      const { error: bodyError, value: bodyValue } = updateExpenseSchema.validate(req.body);
      if (bodyError) {
        throw new ValidationError(bodyError.details[0]?.message || 'Validation error');
      }

      const updateData: UpdateExpenseRequest = bodyValue;
      const expense = await ExpenseService.updateExpense(idValue.id, updateData);

      const response: ApiResponse = {
        data: expense,
        message: 'Expense updated successfully',
        timestamp: new Date().toISOString()
      };

      res.status(HttpStatus.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  // Delete an expense
  static async deleteExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate expense ID parameter
      const { error, value } = expenseIdSchema.validate({ id: parseInt(req.params.id || '0') });
      if (error) {
        throw new ValidationError(error.details[0]?.message || 'Validation error');
      }

      await ExpenseService.deleteExpense(value.id);

      const response: ApiResponse = {
        data: null,
        message: 'Expense deleted successfully',
        timestamp: new Date().toISOString()
      };

      res.status(HttpStatus.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  // Get trends and analytics data
  static async getTrends(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate query parameters
      const { error, value } = trendsQuerySchema.validate(req.query);
      if (error) {
        throw new ValidationError(error.details[0]?.message || 'Validation error');
      }

      const query: TrendsQuery = value;
      const trendsData = await ExpenseService.getTrends(query);

      const response: ApiResponse = {
        data: trendsData,
        timestamp: new Date().toISOString()
      };

      res.status(HttpStatus.OK).json(response);
    } catch (error) {
      next(error);
    }
  }
}