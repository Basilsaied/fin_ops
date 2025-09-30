import dotenv from 'dotenv';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

interface EnvironmentConfig {
  // Server configuration
  PORT: number;
  NODE_ENV: string;
  
  // Database configuration
  DATABASE_URL: string;
  
  // Security configuration
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  RATE_LIMIT_STRICT_MAX: number;
  REQUEST_SIZE_LIMIT: string;
  
  // CORS configuration
  FRONTEND_URL: string;
  ALLOWED_ORIGINS: string[];
  
  // Logging configuration
  LOG_LEVEL: string;
  LOG_MAX_SIZE: string;
  LOG_MAX_FILES: number;
  
  // Security headers
  SECURITY_HEADERS_ENABLED: boolean;
  CSP_ENABLED: boolean;
  
  // Session configuration (for future use)
  SESSION_SECRET?: string;
  SESSION_TIMEOUT: number;
}

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  logger.error('Missing required environment variables', {
    missingVars: missingEnvVars,
    timestamp: new Date().toISOString()
  });
  process.exit(1);
}

// Parse and validate environment variables
const parseNumber = (value: string | undefined, defaultValue: number): number => {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

const parseBoolean = (value: string | undefined, defaultValue: boolean): boolean => {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
};

const parseStringArray = (value: string | undefined, defaultValue: string[]): string[] => {
  if (!value) return defaultValue;
  return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
};

export const config: EnvironmentConfig = {
  // Server configuration
  PORT: parseNumber(process.env.PORT, 5000),
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database configuration
  DATABASE_URL: process.env.DATABASE_URL!,
  
  // Security configuration
  RATE_LIMIT_WINDOW_MS: parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseNumber(process.env.RATE_LIMIT_MAX_REQUESTS, 100),
  RATE_LIMIT_STRICT_MAX: parseNumber(process.env.RATE_LIMIT_STRICT_MAX, 10),
  REQUEST_SIZE_LIMIT: process.env.REQUEST_SIZE_LIMIT || '1mb',
  
  // CORS configuration
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  ALLOWED_ORIGINS: parseStringArray(
    process.env.ALLOWED_ORIGINS, 
    ['http://localhost:3000', 'http://127.0.0.1:3000']
  ),
  
  // Logging configuration
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_MAX_SIZE: process.env.LOG_MAX_SIZE || '5m',
  LOG_MAX_FILES: parseNumber(process.env.LOG_MAX_FILES, 5),
  
  // Security headers
  SECURITY_HEADERS_ENABLED: parseBoolean(process.env.SECURITY_HEADERS_ENABLED, true),
  CSP_ENABLED: parseBoolean(process.env.CSP_ENABLED, true),
  
  // Session configuration
  SESSION_SECRET: process.env.SESSION_SECRET,
  SESSION_TIMEOUT: parseNumber(process.env.SESSION_TIMEOUT, 30 * 60 * 1000), // 30 minutes
};

// Log configuration on startup (excluding sensitive data)
const logConfig = {
  ...config,
  DATABASE_URL: '[REDACTED]',
  SESSION_SECRET: config.SESSION_SECRET ? '[REDACTED]' : undefined
};

logger.info('Environment configuration loaded', {
  config: logConfig,
  timestamp: new Date().toISOString()
});

// Validate configuration in production
if (config.NODE_ENV === 'production') {
  const productionWarnings: string[] = [];
  
  if (!config.SESSION_SECRET) {
    productionWarnings.push('SESSION_SECRET not set - sessions will not be secure');
  }
  
  if (config.LOG_LEVEL === 'debug') {
    productionWarnings.push('LOG_LEVEL is set to debug in production');
  }
  
  if (config.ALLOWED_ORIGINS.includes('http://localhost:3000')) {
    productionWarnings.push('localhost is in ALLOWED_ORIGINS for production');
  }
  
  if (productionWarnings.length > 0) {
    logger.warn('Production configuration warnings', {
      warnings: productionWarnings,
      timestamp: new Date().toISOString()
    });
  }
}