import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Enhanced log format for security events
const securityLogFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      service: 'expense-management-api',
      environment: process.env.NODE_ENV || 'development',
      ...meta
    });
  })
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'expense-management-api' },
  transports: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
  ],
});

// Security-specific logger
export const securityLogger = winston.createLogger({
  level: 'info',
  format: securityLogFormat,
  defaultMeta: { 
    service: 'expense-management-api',
    logType: 'security'
  },
  transports: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'security.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      tailable: true
    }),
    new winston.transports.File({ 
      filename: path.join(logsDir, 'security-audit.log'),
      level: 'warn',
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      tailable: true
    }),
  ],
});

// If we're not in production, log to the console as well
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
  
  securityLogger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ level, message, ...meta }) => {
        return `[SECURITY] ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
      })
    )
  }));
}

// Helper functions for structured logging
export const logSecurityEvent = (event: string, details: Record<string, any>) => {
  securityLogger.info(event, {
    event,
    timestamp: new Date().toISOString(),
    ...details
  });
};

export const logSecurityWarning = (event: string, details: Record<string, any>) => {
  securityLogger.warn(event, {
    event,
    timestamp: new Date().toISOString(),
    severity: 'warning',
    ...details
  });
};

export const logSecurityError = (event: string, details: Record<string, any>) => {
  securityLogger.error(event, {
    event,
    timestamp: new Date().toISOString(),
    severity: 'error',
    ...details
  });
};