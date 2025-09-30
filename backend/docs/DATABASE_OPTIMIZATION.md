# Database Optimization Guide

This document outlines the database optimizations implemented for the expense management system to ensure optimal performance and scalability.

## Overview

The database optimizations include:
- Performance indexes for frequently queried columns
- Connection pooling for concurrent request handling
- Query performance monitoring
- Data archiving strategy for long-term storage management

## Performance Indexes

### Implemented Indexes

The following indexes have been added to the `costs` table:

1. **idx_costs_year_month** - Composite index on (year, month)
   - Optimizes queries filtering by date ranges
   - Used for monthly reports and trend analysis

2. **idx_costs_category** - Single column index on category
   - Optimizes queries filtering by expense category
   - Used for category-specific reports

3. **idx_costs_created_at** - Single column index on created_at
   - Optimizes queries filtering by creation date
   - Used for audit trails and data archiving

4. **idx_costs_updated_at** - Single column index on updated_at
   - Optimizes queries filtering by modification date
   - Used for change tracking

5. **idx_costs_year_month_category** - Composite index on (year, month, category)
   - Optimizes complex trend queries with category filtering
   - Used for detailed analytics

6. **idx_costs_amount** - Single column index on amount
   - Optimizes queries filtering by amount ranges
   - Used for financial analysis

7. **idx_costs_year_category** - Composite index on (year, category)
   - Optimizes yearly category analysis
   - Used for year-over-year comparisons

### Applying Indexes

If you need to manually apply the indexes (e.g., on an existing database), run:

```sql
-- Run the SQL script
psql -d expense_management -f scripts/apply-indexes.sql
```

Or use Prisma migrations:

```bash
npx prisma migrate dev --name add-performance-indexes
```

## Connection Pooling

### Configuration

Connection pooling is configured in `src/config/database.ts` with the following settings:

- **Connection Limit**: 10 connections (configurable via `DB_CONNECTION_LIMIT`)
- **Pool Timeout**: 10 seconds (configurable via `DB_POOL_TIMEOUT`)
- **Query Timeout**: 30 seconds (configurable via `DB_QUERY_TIMEOUT`)

### Environment Variables

```env
DB_CONNECTION_LIMIT=10
DB_POOL_TIMEOUT=10000
DB_QUERY_TIMEOUT=30000
```

### Benefits

- Handles concurrent requests efficiently
- Prevents database connection exhaustion
- Improves response times under load
- Automatic connection management

## Query Performance Monitoring

### Features

- Real-time query performance tracking
- Slow query detection and logging
- Request performance monitoring
- Performance metrics API endpoint

### Monitoring Endpoints

- **GET /metrics** - General performance metrics
- **GET /api/admin/metrics** - Detailed database metrics

### Slow Query Thresholds

- **Database queries**: > 1000ms
- **HTTP requests**: > 2000ms

### Metrics Collected

- Total queries executed
- Number of slow queries
- Average query time
- Request response times
- Memory usage
- System uptime

## Data Archiving Strategy

### Overview

The archiving system automatically moves old data to archive tables to maintain optimal performance while preserving historical data.

### Configuration

```env
DATA_RETENTION_YEARS=10      # Keep 10 years in main table
ARCHIVE_BATCH_SIZE=1000      # Process 1000 records per batch
MAX_ARCHIVE_YEARS=20         # Keep archives for 20 years total
CLEANUP_OLD_ARCHIVES=false   # Don't auto-delete old archives
```

### Scheduled Tasks

- **Monthly Archival**: 1st day of month at 2 AM
- **Weekly Metrics Reset**: Sunday at midnight
- **Monthly Maintenance**: 15th day at 3 AM

### Manual Operations

#### Trigger Manual Archival
```bash
curl -X POST http://localhost:5000/api/admin/archive/trigger \
  -H "Content-Type: application/json" \
  -d '{"retentionYears": 10}'
```

#### Get Archive Statistics
```bash
curl http://localhost:5000/api/admin/archive/stats
```

#### Restore from Archive
```bash
curl -X POST http://localhost:5000/api/admin/archive/restore \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2020-01-01T00:00:00Z",
    "endDate": "2020-12-31T23:59:59Z"
  }'
```

### Archive Table Structure

Archive tables maintain the same structure as the main table with an additional `archived_at` timestamp:

```sql
CREATE TABLE costs_archive (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  month SMALLINT NOT NULL,
  year SMALLINT NOT NULL,
  created_at TIMESTAMPTZ(6) NOT NULL,
  updated_at TIMESTAMPTZ(6) NOT NULL,
  archived_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## Performance Testing

### Running Tests

Execute the performance test suite:

```bash
cd backend
npx ts-node scripts/test-performance.ts
```

### Test Coverage

The test suite verifies:
- Index utilization for common queries
- Query response times
- Connection pooling efficiency
- Database connectivity

### Expected Performance

- Simple queries: < 100ms
- Complex trend queries: < 150ms
- Concurrent connections: 20+ simultaneous
- Archive operations: < 5 seconds per 1000 records

## Monitoring and Maintenance

### Health Checks

- **Database connectivity**: Verified on startup
- **Index presence**: Checked during performance tests
- **Query performance**: Monitored in real-time

### Maintenance Tasks

1. **Weekly**: Reset performance metrics
2. **Monthly**: Archive old data
3. **Monthly**: Database maintenance and cleanup
4. **Quarterly**: Review and optimize slow queries

### Alerts and Logging

- Slow queries are automatically logged
- Performance degradation triggers warnings
- Archive operations are fully logged
- Connection pool exhaustion is monitored

## Troubleshooting

### Common Issues

1. **Slow Queries**
   - Check if indexes are present
   - Review query execution plans
   - Consider adding specific indexes

2. **Connection Pool Exhaustion**
   - Increase `DB_CONNECTION_LIMIT`
   - Check for connection leaks
   - Monitor concurrent request patterns

3. **Archive Failures**
   - Verify disk space availability
   - Check database permissions
   - Review archive table structure

### Performance Optimization Tips

1. Use composite indexes for multi-column filters
2. Avoid SELECT * in production queries
3. Use LIMIT for large result sets
4. Consider query result caching for expensive operations
5. Monitor and tune connection pool settings

## Production Deployment

### Pre-deployment Checklist

- [ ] Run database migrations
- [ ] Apply performance indexes
- [ ] Configure environment variables
- [ ] Test connection pooling
- [ ] Verify archiving configuration
- [ ] Set up monitoring alerts

### Post-deployment Monitoring

- Monitor query performance metrics
- Track connection pool utilization
- Verify scheduled tasks are running
- Check archive operations
- Review slow query logs

## Security Considerations

- Archive tables inherit security policies
- Query monitoring logs are sanitized
- Connection strings are environment-protected
- Admin endpoints require proper authentication (when implemented)

---

For additional support or questions about database optimizations, refer to the main project documentation or contact the development team.