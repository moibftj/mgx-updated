-- Clean slate migration - removes all existing objects before applying new ones
-- This ensures we start with a completely clean database

-- Drop all existing policies first
DROP POLICY IF EXISTS "Employees can view their own discount codes" ON discount_codes;
DROP POLICY IF EXISTS "Employees can insert their own discount codes" ON discount_codes;
DROP POLICY IF EXISTS "Employees can update their own discount codes" ON discount_codes;
DROP POLICY IF EXISTS "Anyone can validate active discount codes" ON discount_codes;
DROP POLICY IF EXISTS "Admins can view all discount codes" ON discount_codes;
DROP POLICY IF EXISTS "Employees can view their discount usage" ON discount_usage;
DROP POLICY IF EXISTS "Users can view their own discount usage" ON discount_usage;
DROP POLICY IF EXISTS "System can insert discount usage" ON discount_usage;
DROP POLICY IF EXISTS "Admins can view all discount usage" ON discount_usage;
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON subscriptions;

-- Drop all existing triggers
DROP TRIGGER IF EXISTS update_discount_codes_updated_at ON discount_codes;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;

-- Drop all existing indexes
DROP INDEX IF EXISTS idx_discount_codes_employee_id;
DROP INDEX IF EXISTS idx_discount_codes_code;
DROP INDEX IF EXISTS idx_discount_codes_is_active;
DROP INDEX IF EXISTS idx_discount_usage_discount_code_id;
DROP INDEX IF EXISTS idx_discount_usage_user_id;
DROP INDEX IF EXISTS idx_discount_usage_employee_id;
DROP INDEX IF EXISTS idx_discount_usage_used_at;
DROP INDEX IF EXISTS idx_subscriptions_user_id;
DROP INDEX IF EXISTS idx_subscriptions_status;
DROP INDEX IF EXISTS idx_subscriptions_plan_type;

-- Drop all existing tables (cascade to remove dependencies)
DROP TABLE IF EXISTS discount_usage CASCADE;
DROP TABLE IF EXISTS discount_codes CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;