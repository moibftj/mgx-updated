-- Migration: Add employee points system and user credits tracking
-- Created: 2024-09-20

-- Create employee_points table to track point earnings
CREATE TABLE IF NOT EXISTS employee_points (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    points_earned INTEGER NOT NULL DEFAULT 1,
    source VARCHAR(50) NOT NULL DEFAULT 'referral',
    reference_id UUID, -- Can reference discount_usage.id or other tables
    description TEXT,
    earned_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_credits table to track subscription credits
CREATE TABLE IF NOT EXISTS user_credits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
    total_credits INTEGER NOT NULL DEFAULT 0,
    remaining_credits INTEGER NOT NULL DEFAULT 0,
    plan_type VARCHAR(20) NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_employee_points_employee_id ON employee_points(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_points_earned_at ON employee_points(earned_at);
CREATE INDEX IF NOT EXISTS idx_employee_points_source ON employee_points(source);

CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_credits_subscription_id ON user_credits(subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_credits_expires_at ON user_credits(expires_at);

-- Add additional columns to subscriptions table
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS original_amount DECIMAL(10,2);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS payment_method_id VARCHAR(255);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS billing_details JSONB;

-- Enable RLS on new tables
ALTER TABLE employee_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employee_points (drop existing first)

-- Employees can view their own points
DROP POLICY IF EXISTS "Employees can view their own points" ON employee_points;
CREATE POLICY "Employees can view their own points"
    ON employee_points FOR SELECT
    USING (employee_id = auth.uid());

-- System can insert points (for automated rewards)
DROP POLICY IF EXISTS "System can insert employee points" ON employee_points;
CREATE POLICY "System can insert employee points"
    ON employee_points FOR INSERT
    WITH CHECK (true);

-- Admins can view all points
DROP POLICY IF EXISTS "Admins can view all employee points" ON employee_points;
CREATE POLICY "Admins can view all employee points"
    ON employee_points FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.uid() = auth.users.id
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- RLS Policies for user_credits (drop existing first)

-- Users can view their own credits
DROP POLICY IF EXISTS "Users can view their own credits" ON user_credits;
CREATE POLICY "Users can view their own credits"
    ON user_credits FOR SELECT
    USING (user_id = auth.uid());

-- System can manage user credits
DROP POLICY IF EXISTS "System can manage user credits" ON user_credits;
CREATE POLICY "System can manage user credits"
    ON user_credits FOR ALL
    WITH CHECK (true);

-- Admins can view all credits
DROP POLICY IF EXISTS "Admins can view all user credits" ON user_credits;
CREATE POLICY "Admins can view all user credits"
    ON user_credits FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.uid() = auth.users.id
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Add updated_at trigger for user_credits
CREATE TRIGGER update_user_credits_updated_at
    BEFORE UPDATE ON user_credits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get employee total points
CREATE OR REPLACE FUNCTION get_employee_total_points(employee_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN COALESCE(
        (SELECT SUM(points_earned)
         FROM employee_points
         WHERE employee_id = employee_uuid),
        0
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user remaining credits
CREATE OR REPLACE FUNCTION get_user_remaining_credits(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN COALESCE(
        (SELECT SUM(remaining_credits)
         FROM user_credits
         WHERE user_id = user_uuid
         AND (expires_at IS NULL OR expires_at > NOW())),
        0
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deduct user credit when creating a letter
CREATE OR REPLACE FUNCTION deduct_user_credit(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    credit_record RECORD;
BEGIN
    -- Find the oldest credit record with remaining credits
    SELECT id, remaining_credits INTO credit_record
    FROM user_credits
    WHERE user_id = user_uuid
    AND remaining_credits > 0
    AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY created_at ASC
    LIMIT 1;

    -- If no credits available, return false
    IF NOT FOUND OR credit_record.remaining_credits <= 0 THEN
        RETURN FALSE;
    END IF;

    -- Deduct one credit
    UPDATE user_credits
    SET remaining_credits = remaining_credits - 1,
        updated_at = NOW()
    WHERE id = credit_record.id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate employee analytics with points
CREATE OR REPLACE FUNCTION get_employee_analytics_with_points(employee_uuid UUID)
RETURNS TABLE (
    total_referrals BIGINT,
    total_commissions DECIMAL,
    total_points INTEGER,
    monthly_earnings DECIMAL,
    monthly_points INTEGER,
    active_discount_codes BIGINT,
    code_usage_stats JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH usage_data AS (
        SELECT
            du.*,
            dc.code,
            DATE_TRUNC('month', du.used_at) = DATE_TRUNC('month', NOW()) as is_current_month
        FROM discount_usage du
        JOIN discount_codes dc ON du.discount_code_id = dc.id
        WHERE du.employee_id = employee_uuid
    ),
    points_data AS (
        SELECT
            COUNT(*) as total_points_count,
            SUM(CASE WHEN DATE_TRUNC('month', earned_at) = DATE_TRUNC('month', NOW()) THEN points_earned ELSE 0 END) as monthly_points_sum
        FROM employee_points
        WHERE employee_id = employee_uuid
    ),
    codes_data AS (
        SELECT COUNT(*) as active_codes_count
        FROM discount_codes
        WHERE employee_id = employee_uuid AND is_active = true
    )
    SELECT
        COALESCE((SELECT COUNT(*) FROM usage_data), 0)::BIGINT as total_referrals,
        COALESCE((SELECT SUM(commission_amount) FROM usage_data), 0) as total_commissions,
        COALESCE((SELECT total_points_count FROM points_data), 0)::INTEGER as total_points,
        COALESCE((SELECT SUM(commission_amount) FROM usage_data WHERE is_current_month), 0) as monthly_earnings,
        COALESCE((SELECT monthly_points_sum FROM points_data), 0)::INTEGER as monthly_points,
        COALESCE((SELECT active_codes_count FROM codes_data), 0)::BIGINT as active_discount_codes,
        COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'code', code,
                    'usageCount', count(*),
                    'totalRevenue', sum(subscription_amount),
                    'totalCommissions', sum(commission_amount)
                )
            )
            FROM usage_data
            GROUP BY code),
            '[]'::jsonb
        ) as code_usage_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_employee_total_points(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_remaining_credits(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_user_credit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_employee_analytics_with_points(UUID) TO authenticated;

-- Add constraints
ALTER TABLE employee_points ADD CONSTRAINT check_points_positive CHECK (points_earned > 0);
ALTER TABLE user_credits ADD CONSTRAINT check_credits_non_negative CHECK (total_credits >= 0 AND remaining_credits >= 0);
ALTER TABLE user_credits ADD CONSTRAINT check_remaining_not_exceed_total CHECK (remaining_credits <= total_credits);

-- Add comments
COMMENT ON TABLE employee_points IS 'Tracks points earned by employees for referrals and other activities';
COMMENT ON TABLE user_credits IS 'Tracks letter credits available to users based on their subscriptions';

COMMENT ON COLUMN employee_points.source IS 'Source of points: referral, bonus, etc.';
COMMENT ON COLUMN employee_points.reference_id IS 'Reference to the record that generated these points';
COMMENT ON COLUMN user_credits.remaining_credits IS 'Number of letters user can still generate';
COMMENT ON COLUMN user_credits.expires_at IS 'When these credits expire (NULL for one-time purchases)';

COMMENT ON FUNCTION get_employee_total_points(UUID) IS 'Returns total points earned by an employee';
COMMENT ON FUNCTION get_user_remaining_credits(UUID) IS 'Returns remaining letter credits for a user';
COMMENT ON FUNCTION deduct_user_credit(UUID) IS 'Deducts one credit when user creates a letter';
COMMENT ON FUNCTION get_employee_analytics_with_points(UUID) IS 'Returns comprehensive employee analytics including points';