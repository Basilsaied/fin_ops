-- Initialize database for expense management system
-- This script runs when the PostgreSQL container starts for the first time

-- Create the main database if it doesn't exist
-- (This is handled by POSTGRES_DB environment variable)

-- Create application user with limited privileges
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'expense_app') THEN
        CREATE ROLE expense_app WITH LOGIN PASSWORD 'app_password_change_in_production';
    END IF;
END
$$;

-- Grant necessary privileges to the application user
GRANT CONNECT ON DATABASE expense_management TO expense_app;
GRANT USAGE ON SCHEMA public TO expense_app;
GRANT CREATE ON SCHEMA public TO expense_app;

-- Create extension for UUID generation (if needed in future)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create extension for better text search (if needed in future)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set up logging table for audit trail (optional)
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    operation VARCHAR(10) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    user_id VARCHAR(100),
    ip_address INET,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on audit log for performance
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_operation ON audit_log(table_name, operation);

-- Grant permissions on audit log
GRANT SELECT, INSERT ON audit_log TO expense_app;
GRANT USAGE ON SEQUENCE audit_log_id_seq TO expense_app;