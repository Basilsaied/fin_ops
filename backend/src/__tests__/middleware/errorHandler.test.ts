import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../middleware/errorHandler';
import { ApiError } from '../../utils/errors';
import { HttpStatus } from '../../types/api';

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn()
  }
}));

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    statusMock = jest.fn().mockReturnThis();
    jsonMock = jest.fn();
    
    mockRequest = {
      path: '/api/expenses',
      method: 'POST',
      body: { test: 'data' },
      query: { filter: 'test' },
      params: { id: '1' }
    };
    
    mockResponse = {
      status: statusMock,
      json: jsonMock
    };
    
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('ApiError handling', () => {
    it('should handle ValidationError correctly', () => {
      const validationError = new ApiError(
        'Validation failed',
        HttpStatus.BAD_REQUEST,
        'VALIDATION_ERROR'
      );

      errorHandler(
        validationError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          timestamp: expect.any(String),
          path: '/api/expenses'
        }
      });
    });

    it('should handle NotFoundError correctly', () => {
      const notFoundError = new ApiError(
        'Resource not found',
        HttpStatus.NOT_FOUND,
        'NOT_FOUND'
      );

      errorHandler(
        notFoundError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          message: 'Resource not found',
          code: 'NOT_FOUND',
          timestamp: expect.any(String),
          path: '/api/expenses'
        }
      });
    });

    it('should handle ConflictError correctly', () => {
      const conflictError = new ApiError(
        'Duplicate entry',
        HttpStatus.CONFLICT,
        'DUPLICATE_ENTRY'
      );

      errorHandler(
        conflictError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          message: 'Duplicate entry',
          code: 'DUPLICATE_ENTRY',
          timestamp: expect.any(String),
          path: '/api/expenses'
        }
      });
    });

    it('should include correct timestamp format', () => {
      const error = new ApiError('Test error', HttpStatus.BAD_REQUEST, 'TEST_ERROR');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      const callArgs = jsonMock.mock.calls[0][0];
      const timestamp = callArgs.error.timestamp;
      
      // Check if timestamp is valid ISO string
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    });
  });

  describe('Generic Error handling', () => {
    it('should handle generic Error in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const genericError = new Error('Something went wrong');

      errorHandler(
        genericError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          message: 'Something went wrong',
          code: 'INTERNAL_ERROR',
          timestamp: expect.any(String),
          path: '/api/expenses'
        }
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should hide error details in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const genericError = new Error('Database connection failed');

      errorHandler(
        genericError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
          timestamp: expect.any(String),
          path: '/api/expenses'
        }
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle errors without message', () => {
      const errorWithoutMessage = new Error();

      errorHandler(
        errorWithoutMessage,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(jsonMock).toHaveBeenCalled();
    });
  });

  describe('Logging', () => {
    it('should log error details', () => {
      const { logger } = require('../../utils/logger');
      const error = new ApiError('Test error', HttpStatus.BAD_REQUEST, 'TEST_ERROR');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(logger.error).toHaveBeenCalledWith('API Error:', {
        message: 'Test error',
        stack: error.stack,
        path: '/api/expenses',
        method: 'POST',
        body: { test: 'data' },
        query: { filter: 'test' },
        params: { id: '1' }
      });
    });

    it('should log generic error details', () => {
      const { logger } = require('../../utils/logger');
      const error = new Error('Generic error');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(logger.error).toHaveBeenCalledWith('API Error:', {
        message: 'Generic error',
        stack: error.stack,
        path: '/api/expenses',
        method: 'POST',
        body: { test: 'data' },
        query: { filter: 'test' },
        params: { id: '1' }
      });
    });
  });

  describe('Response format consistency', () => {
    it('should always return consistent error response structure', () => {
      const errors = [
        new ApiError('Validation error', HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR'),
        new ApiError('Not found', HttpStatus.NOT_FOUND, 'NOT_FOUND'),
        new Error('Generic error')
      ];

      errors.forEach((error, index) => {
        // Reset mocks for each iteration
        statusMock.mockClear();
        jsonMock.mockClear();

        errorHandler(
          error,
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        const responseBody = jsonMock.mock.calls[0][0];
        
        expect(responseBody).toHaveProperty('error');
        expect(responseBody.error).toHaveProperty('message');
        expect(responseBody.error).toHaveProperty('code');
        expect(responseBody.error).toHaveProperty('timestamp');
        expect(responseBody.error).toHaveProperty('path');
        
        expect(typeof responseBody.error.message).toBe('string');
        expect(typeof responseBody.error.code).toBe('string');
        expect(typeof responseBody.error.timestamp).toBe('string');
        expect(typeof responseBody.error.path).toBe('string');
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle null error', () => {
      errorHandler(
        null as any,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(jsonMock).toHaveBeenCalled();
    });

    it('should handle undefined error', () => {
      errorHandler(
        undefined as any,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(jsonMock).toHaveBeenCalled();
    });

    it('should handle error with circular references', () => {
      const circularError: any = new Error('Circular error');
      circularError.circular = circularError;

      expect(() => {
        errorHandler(
          circularError,
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );
      }).not.toThrow();

      expect(statusMock).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(jsonMock).toHaveBeenCalled();
    });
  });
});