-- Migration: Add discount code and subscription functionality
-- Created: 2024-09-19

-- Create discount_codes table
CREATE TABLE IF NOT EXISTS discount_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    discount_percentage INTEGER NOT NULL DEFAULT 20,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create discount_usage table
CREATE TABLE IF NOT EXISTS discount_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    discount_code_id UUID NOT NULL REFERENCES discount_codes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_amount DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('one_letter', 'four_monthly', 'eight_yearly')),
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('inactive', 'active', 'past_due', 'cancelled', 'unpaid')),
    discount_code_id UUID REFERENCES discount_codes(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_discount_codes_employee_id ON discount_codes(employee_id);
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON discount_codes(is_active);

CREATE INDEX IF NOT EXISTS idx_discount_usage_employee_id ON discount_usage(employee_id);
CREATE INDEX IF NOT EXISTS idx_discount_usage_user_id ON discount_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_discount_usage_code_id ON discount_usage(discount_code_id);
CREATE INDEX IF NOT EXISTS idx_discount_usage_used_at ON discount_usage(used_at);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_type ON subscriptions(plan_type);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers (conditionally)
DO $$
BEGIN
    -- Create discount_codes trigger if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_discount_codes_updated_at') THEN
        CREATE TRIGGER update_discount_codes_updated_at
            BEFORE UPDATE ON discount_codes
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Create subscriptions trigger if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_subscriptions_updated_at') THEN
        CREATE TRIGGER update_subscriptions_updated_at
            BEFORE UPDATE ON subscriptions
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Add Row Level Security (RLS) policies

-- Enable RLS on all tables
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Discount codes policies (drop existing first)
-- Employees can view and manage their own discount codes
DROP POLICY IF EXISTS "Employees can view their own discount codes" ON discount_codes;
CREATE POLICY "Employees can view their own discount codes"
    ON discount_codes FOR SELECT
    USING (employee_id = auth.uid());

DROP POLICY IF EXISTS "Employees can insert their own discount codes" ON discount_codes;
CREATE POLICY "Employees can insert their own discount codes"
    ON discount_codes FOR INSERT
    WITH CHECK (employee_id = auth.uid());

DROP POLICY IF EXISTS "Employees can update their own discount codes" ON discount_codes;
CREATE POLICY "Employees can update their own discount codes"
    ON discount_codes FOR UPDATE
    USING (employee_id = auth.uid())
    WITH CHECK (employee_id = auth.uid());

-- Allow anyone to read active discount codes for validation
DROP POLICY IF EXISTS "Anyone can validate active discount codes" ON discount_codes;
CREATE POLICY "Anyone can validate active discount codes"
    ON discount_codes FOR SELECT
    USING (is_active = true);

-- Admin can view all discount codes
DROP POLICY IF EXISTS "Admins can view all discount codes" ON discount_codes;
CREATE POLICY "Admins can view all discount codes"
    ON discount_codes FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Discount usage policies (drop existing first)
-- Employees can view their own discount usage
DROP POLICY IF EXISTS "Employees can view their discount usage" ON discount_usage;
CREATE POLICY "Employees can view their discount usage"
    ON discount_usage FOR SELECT
    USING (employee_id = auth.uid());

-- Users can view their own discount usage
DROP POLICY IF EXISTS "Users can view their own discount usage" ON discount_usage;
CREATE POLICY "Users can view their own discount usage"
    ON discount_usage FOR SELECT
    USING (user_id = auth.uid());

-- System can insert discount usage records
DROP POLICY IF EXISTS "System can insert discount usage" ON discount_usage;
CREATE POLICY "System can insert discount usage"
    ON discount_usage FOR INSERT
    WITH CHECK (true);

-- Admins can view all discount usage
DROP POLICY IF EXISTS "Admins can view all discount usage" ON discount_usage;
CREATE POLICY "Admins can view all discount usage"
    ON discount_usage FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.uid() = auth.users.id
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Subscription policies (drop existing first)
-- Users can view their own subscriptions
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
CREATE POLICY "Users can view their own subscriptions"
    ON subscriptions FOR SELECT
    USING (user_id = auth.uid());

-- Users can insert their own subscriptions
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON subscriptions;
CREATE POLICY "Users can insert their own subscriptions"
    ON subscriptions FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Users can update their own subscriptions
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON subscriptions;
CREATE POLICY "Users can update their own subscriptions"
    ON subscriptions FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Admins can view all subscriptions
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON subscriptions;
CREATE POLICY "Admins can view all subscriptions"
    ON subscriptions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.uid() = auth.users.id
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Add some sample data for testing (optional)
-- You can uncomment these lines if you want sample data

-- INSERT INTO discount_codes (code, employee_id, discount_percentage, is_active, usage_count)
-- VALUES
--     ('EMP-DEMO1', (SELECT id FROM auth.users WHERE email = 'employee@example.com'), 20, true, 0),
--     ('EMP-DEMO2', (SELECT id FROM auth.users WHERE email = 'employee@example.com'), 20, true, 5);

COMMENT ON TABLE discount_codes IS 'Stores discount codes generated by employees';
COMMENT ON TABLE discount_usage IS 'Tracks when discount codes are used and calculates commissions';
COMMENT ON TABLE subscriptions IS 'Stores user subscription information';

COMMENT ON COLUMN discount_codes.code IS 'Unique discount code (format: EMP-XXXXX)';
COMMENT ON COLUMN discount_codes.discount_percentage IS 'Percentage discount (default 20%)';
COMMENT ON COLUMN discount_usage.commission_amount IS 'Employee commission amount (5% of subscription)';
COMMENT ON COLUMN subscriptions.plan_type IS 'Type of subscription plan';
COMMENT ON COLUMN subscriptions.amount IS 'Amount paid for subscription';