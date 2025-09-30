// API Error types
export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, any>;
}

export interface ErrorResponse {
  error: {
    message: string;
    code: string;
    timestamp: string;
    path: string;
  };
}

// Success response wrapper
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  timestamp: string;
}

// Pagination types
export interface PaginationQuery {
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  timestamp: string;
}

// HTTP Status codes enum
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
}

// Common API error codes
export enum ApiErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
}