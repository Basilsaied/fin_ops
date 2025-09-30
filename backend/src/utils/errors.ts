import { ApiErrorCode } from '../types/api';

// Base API Error class
export class ApiError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, any>;

  constructor(
    message: string,
    code: string = ApiErrorCode.INTERNAL_ERROR,
    statusCode: number = 500,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    if (details) {
      this.details = details;
    }

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

// Validation Error
export class ValidationError extends ApiError {
  constructor(message: string, field?: string) {
    super(
      message,
      ApiErrorCode.VALIDATION_ERROR,
      422,
      field ? { field } : undefined
    );
    this.name = 'ValidationError';
  }
}

// Duplicate Entry Error
export class DuplicateEntryError extends ApiError {
  constructor(message: string = 'Duplicate entry found') {
    super(message, ApiErrorCode.DUPLICATE_ENTRY, 409);
    this.name = 'DuplicateEntryError';
  }
}

// Not Found Error
export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(message, ApiErrorCode.NOT_FOUND, 404);
    this.name = 'NotFoundError';
  }
}

// Database Error
export class DatabaseError extends ApiError {
  constructor(message: string = 'Database operation failed') {
    super(message, ApiErrorCode.DATABASE_ERROR, 500);
    this.name = 'DatabaseError';
  }
}

// Invalid Input Error
export class InvalidInputError extends ApiError {
  constructor(message: string = 'Invalid input provided') {
    super(message, ApiErrorCode.INVALID_INPUT, 400);
    this.name = 'InvalidInputError';
  }
}