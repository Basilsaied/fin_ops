import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/errors';
import { ErrorResponse, HttpStatus } from '../types/api';
import { logger } from '../utils/logger';

export const errorHandler = (
  error: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log the error
  logger.error('API Error:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params
  });

  // Handle ApiError instances
  if (error instanceof ApiError) {
    const errorResponse: ErrorResponse = {
      error: {
        message: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
        path: req.path
      }
    };

    res.status(error.statusCode).json(errorResponse);
    return;
  }

  // Handle generic errors
  const errorResponse: ErrorResponse = {
    error: {
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message,
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
      path: req.path
    }
  };

  res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse);
};