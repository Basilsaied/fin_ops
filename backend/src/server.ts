import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger, securityLogger } from './utils/logger';
import { config } from './config/environment';
import { connectDatabase, disconnectDatabase } from './config/database';
import expenseRoutes from './routes/expenseRoutes';
import adminRoutes from './routes/adminRoutes';
import { errorHandler } from './middleware/errorHandler';
import { requestPerformanceMiddleware, getPerformanceMetrics } from './middleware/queryMonitoring';
import { ScheduledTasks } from './tasks/scheduledTasks';
import { 
  generalRateLimit, 
  strictRateLimit, 
  sanitizeInput, 
  requestSizeLimit, 
  securityAuditLogger,
  additionalSecurityHeaders
} from './middleware/security';

const app = express();
const PORT = config.PORT;

// Security middleware - applied first
app.use(securityAuditLogger);
app.use(requestSizeLimit);
app.use(generalRateLimit);
app.use(additionalSecurityHeaders);

// Helmet security headers
app.use(helmet({
  crossOriginEmbedderPolicy: config.NODE_ENV === 'production',
  contentSecurityPolicy: config.CSP_ENABLED ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for React
      scriptSrc: ["'self'"], 
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  } : false,
  hsts: config.NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false
}));

// Enhanced CORS configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin in development (like mobile apps or curl requests)
    if (!origin && config.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    const allowedOrigins = [config.FRONTEND_URL, ...config.ALLOWED_ORIGINS];
    
    if (origin && allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      securityLogger.warn('CORS violation attempt', {
        origin,
        allowedOrigins,
        ip: 'unknown', // Will be logged by security audit logger
        timestamp: new Date().toISOString()
      });
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count'], // For pagination headers
};

app.use(cors(corsOptions));

// Input sanitization and parsing
app.use(express.json({ limit: config.REQUEST_SIZE_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: config.REQUEST_SIZE_LIMIT }));
app.use(sanitizeInput);

// Add performance monitoring middleware
app.use(requestPerformanceMiddleware);

// Development middleware for React
if (process.env.NODE_ENV === 'development') {
  // Log all requests in development
  app.use((req, res, next) => {
    logger.debug(`${req.method} ${req.path} - ${req.ip}`);
    next();
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'expense-management-api'
  });
});

// Performance metrics endpoint
app.get('/metrics', (req, res) => {
  const metrics = getPerformanceMetrics();
  res.status(200).json(metrics);
});

// API routes
app.get('/api', (req, res) => {
  res.json({ message: 'Expense Management API' });
});

// Mount expense routes with rate limiting
app.use('/api/expenses', expenseRoutes);

// Mount admin routes with strict rate limiting
app.use('/api/admin', strictRateLimit, adminRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND',
      timestamp: new Date().toISOString(),
      path: req.path
    }
  });
});

app.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Connect to database
  await connectDatabase();
  
  // Initialize scheduled tasks
  ScheduledTasks.initialize();
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  await disconnectDatabase();
  process.exit(0);
});