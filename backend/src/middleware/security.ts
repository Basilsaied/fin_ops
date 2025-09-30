import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import { logger } from '../utils/logger';

// Rate limiting configuration
export const createRateLimit = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: {
        message,
        code: 'RATE_LIMIT_EXCEEDED',
        timestamp: new Date().toISOString()
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`, {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
      
      res.status(429).json({
        error: {
          message,
          code: 'RATE_LIMIT_EXCEEDED',
          timestamp: new Date().toISOString(),
          path: req.path
        }
      });
    }
  });
};

// General API rate limiting
export const generalRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // limit each IP to 100 requests per windowMs
  'Too many requests from this IP, please try again later'
);

// Strict rate limiting for sensitive operations
export const strictRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  10, // limit each IP to 10 requests per windowMs
  'Too many requests for this operation, please try again later'
);

// Input sanitization middleware
export const sanitizeInput = [
  // Remove any keys that contain prohibited characters
  mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      logger.warn(`Sanitized potentially malicious input`, {
        ip: req.ip,
        path: req.path,
        sanitizedKey: key,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
    }
  }),
  
  // Prevent HTTP Parameter Pollution attacks
  hpp({
    whitelist: ['category', 'year', 'month'] // Allow arrays for these parameters
  })
];

// Request size limiting middleware
export const requestSizeLimit = (req: Request, res: Response, next: NextFunction) => {
  const contentLength = req.get('content-length');
  const maxSize = 1024 * 1024; // 1MB limit
  
  if (contentLength && parseInt(contentLength) > maxSize) {
    logger.warn(`Request size limit exceeded`, {
      ip: req.ip,
      path: req.path,
      contentLength,
      maxSize,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    
    return res.status(413).json({
      error: {
        message: 'Request entity too large',
        code: 'REQUEST_TOO_LARGE',
        timestamp: new Date().toISOString(),
        path: req.path
      }
    });
  }
  
  next();
};

// Security audit logging middleware
export const securityAuditLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Log security-relevant request information
  const securityInfo = {
    ip: req.ip,
    method: req.method,
    path: req.path,
    userAgent: req.get('User-Agent'),
    referer: req.get('Referer'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    timestamp: new Date().toISOString(),
    sessionId: req.sessionID || 'anonymous'
  };
  
  // Log all requests for security audit
  logger.info('Security audit log', securityInfo);
  
  // Override res.json to log response information
  const originalJson = res.json;
  res.json = function(body: any) {
    const responseTime = Date.now() - startTime;
    
    // Log response information
    logger.info('Security audit response', {
      ...securityInfo,
      statusCode: res.statusCode,
      responseTime,
      responseSize: JSON.stringify(body).length
    });
    
    // Log failed authentication/authorization attempts
    if (res.statusCode === 401 || res.statusCode === 403) {
      logger.warn('Security: Unauthorized access attempt', {
        ...securityInfo,
        statusCode: res.statusCode,
        responseTime
      });
    }
    
    return originalJson.call(this, body);
  };
  
  next();
};

// Validation error handler
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    logger.warn('Validation errors detected', {
      ip: req.ip,
      path: req.path,
      errors: errors.array(),
      body: req.body,
      timestamp: new Date().toISOString()
    });
    
    return res.status(400).json({
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors.array(),
        timestamp: new Date().toISOString(),
        path: req.path
      }
    });
  }
  
  next();
};

// Enhanced input validation for expense data
export const validateExpenseInput = [
  body('category')
    .isIn([
      'Salaries',
      'Software & Tools', 
      'Infrastructure & Hosting',
      'Hardware & Equipment',
      'Security & Compliance',
      'Operational & Administrative',
      'Continuous Learning & R&D'
    ])
    .withMessage('Invalid expense category'),
    
  body('amount')
    .isFloat({ min: 0.01, max: 999999999.99 })
    .withMessage('Amount must be a positive number with maximum 2 decimal places'),
    
  body('month')
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12'),
    
  body('year')
    .isInt({ min: 2020, max: 2050 })
    .withMessage('Year must be between 2020 and 2050'),
    
  handleValidationErrors
];

// XSS protection for text fields
export const sanitizeTextFields = [
  body('*').escape().trim(),
  body('category').unescape(), // Category needs to be unescaped as it contains &
];

// Additional security headers middleware
export const additionalSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};