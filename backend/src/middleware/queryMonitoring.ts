import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface QueryMetrics {
  totalQueries: number;
  slowQueries: number;
  averageQueryTime: number;
  queryTimes: number[];
}

class QueryMonitor {
  private metrics: QueryMetrics = {
    totalQueries: 0,
    slowQueries: 0,
    averageQueryTime: 0,
    queryTimes: []
  };

  private readonly SLOW_QUERY_THRESHOLD = 1000; // 1 second
  private readonly MAX_QUERY_TIMES_STORED = 1000;

  recordQuery(duration: number, query?: string) {
    this.metrics.totalQueries++;
    this.metrics.queryTimes.push(duration);

    // Keep only the last N query times to prevent memory leaks
    if (this.metrics.queryTimes.length > this.MAX_QUERY_TIMES_STORED) {
      this.metrics.queryTimes = this.metrics.queryTimes.slice(-this.MAX_QUERY_TIMES_STORED);
    }

    // Calculate average
    this.metrics.averageQueryTime = 
      this.metrics.queryTimes.reduce((sum, time) => sum + time, 0) / this.metrics.queryTimes.length;

    // Check for slow queries
    if (duration > this.SLOW_QUERY_THRESHOLD) {
      this.metrics.slowQueries++;
      logger.warn(`Slow query detected: ${duration}ms`, {
        duration,
        query: query?.substring(0, 200), // Log first 200 chars of query
        threshold: this.SLOW_QUERY_THRESHOLD
      });
    }

    // Log query performance in development
    if (process.env.NODE_ENV === 'development' && duration > 100) {
      logger.debug(`Query executed in ${duration}ms`);
    }
  }

  getMetrics(): QueryMetrics & { slowQueryPercentage: number } {
    return {
      ...this.metrics,
      slowQueryPercentage: this.metrics.totalQueries > 0 
        ? (this.metrics.slowQueries / this.metrics.totalQueries) * 100 
        : 0
    };
  }

  resetMetrics() {
    this.metrics = {
      totalQueries: 0,
      slowQueries: 0,
      averageQueryTime: 0,
      queryTimes: []
    };
  }
}

export const queryMonitor = new QueryMonitor();

// Middleware to track request performance
export const requestPerformanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const duration = Date.now() - startTime;
    
    // Log slow requests
    if (duration > 2000) { // 2 seconds
      logger.warn(`Slow request detected: ${req.method} ${req.path} - ${duration}ms`, {
        method: req.method,
        path: req.path,
        duration,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
    }
    
    // Log request performance in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`${req.method} ${req.path} - ${duration}ms`);
    }
    
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Health check endpoint for monitoring
export const getPerformanceMetrics = () => {
  const metrics = queryMonitor.getMetrics();
  
  return {
    database: {
      totalQueries: metrics.totalQueries,
      slowQueries: metrics.slowQueries,
      slowQueryPercentage: metrics.slowQueryPercentage,
      averageQueryTime: Math.round(metrics.averageQueryTime * 100) / 100, // Round to 2 decimal places
    },
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  };
};