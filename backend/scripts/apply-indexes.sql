-- Apply performance indexes to existing database
-- This script can be run manually if Prisma migrations are not available

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_costs_year_month ON costs(year, month);
CREATE INDEX IF NOT EXISTS idx_costs_category ON costs(category);
CREATE INDEX IF NOT EXISTS idx_costs_created_at ON costs(created_at);
CREATE INDEX IF NOT EXISTS idx_costs_updated_at ON costs(updated_at);

-- Composite index for trend queries
CREATE INDEX IF NOT EXISTS idx_costs_year_month_category ON costs(year, month, category);

-- Index for amount-based queries (filtering by amount ranges)
CREATE INDEX IF NOT EXISTS idx_costs_amount ON costs(amount);

-- Composite index for date range queries
CREATE INDEX IF NOT EXISTS idx_costs_year_category ON costs(year, category);

-- Verify indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'costs'
ORDER BY indexname;