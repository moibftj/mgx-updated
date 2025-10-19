-- Migration: Add missing tables for subscription and discount system
-- Created: 2024-01-03

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('one_letter', 'four_monthly', 'eight_yearly')),
    amount DECIMAL(10,2) NOT NULL,
    original_amount DECIMAL(10,2),
    discount_amount DECIMAL(10,2) DEFAULT 0,
    discount_code_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('inactive', 'active', 'past_due', 'cancelled', 'unpaid')),
    payment_method_id VARCHAR(255),
    billing_details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create discount_codes table
CREATE TABLE IF NOT EXISTS discount_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_percentage INTEGER NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
    employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    usage_count INTEGER NOT NULL DEFAULT 0,
    max_uses INTEGER,
    expires_at TIMESTAMPTZ,
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

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_type ON subscriptions(plan_type);

CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_employee_id ON discount_codes(employee_id);
CREATE INDEX IF NOT EXISTS idx_discount_codes_is_active ON discount_codes(is_active);

CREATE INDEX IF NOT EXISTS idx_discount_usage_discount_code_id ON discount_usage(discount_code_id);
CREATE INDEX IF NOT EXISTS idx_discount_usage_user_id ON discount_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_discount_usage_employee_id ON discount_usage(employee_id);
CREATE INDEX IF NOT EXISTS idx_discount_usage_used_at ON discount_usage(used_at);

-- Enable RLS on new tables
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
CREATE POLICY "Users can view their own subscriptions"
    ON subscriptions FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "System can manage subscriptions"
    ON subscriptions FOR ALL
    WITH CHECK (true);

CREATE POLICY "Admins can view all subscriptions"
    ON subscriptions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for discount_codes
CREATE POLICY "Employees can view their own discount codes"
    ON discount_codes FOR SELECT
    USING (employee_id = auth.uid());

CREATE POLICY "System can manage discount codes"
    ON discount_codes FOR ALL
    WITH CHECK (true);

CREATE POLICY "Admins can view all discount codes"
    ON discount_codes FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for discount_usage
CREATE POLICY "Users can view their own discount usage"
    ON discount_usage FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Employees can view their referral usage"
    ON discount_usage FOR SELECT
    USING (employee_id = auth.uid());

CREATE POLICY "System can manage discount usage"
    ON discount_usage FOR ALL
    WITH CHECK (true);

CREATE POLICY "Admins can view all discount usage"
    ON discount_usage FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Add updated_at triggers for new tables
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_discount_codes_updated_at
    BEFORE UPDATE ON discount_codes
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Add constraints
ALTER TABLE subscriptions ADD CONSTRAINT check_amount_positive CHECK (amount > 0);
ALTER TABLE subscriptions ADD CONSTRAINT check_original_amount_positive CHECK (original_amount IS NULL OR original_amount > 0);
ALTER TABLE subscriptions ADD CONSTRAINT check_discount_amount_non_negative CHECK (discount_amount >= 0);

ALTER TABLE discount_codes ADD CONSTRAINT check_usage_count_non_negative CHECK (usage_count >= 0);
ALTER TABLE discount_codes ADD CONSTRAINT check_max_uses_positive CHECK (max_uses IS NULL OR max_uses > 0);

ALTER TABLE discount_usage ADD CONSTRAINT check_subscription_amount_positive CHECK (subscription_amount > 0);
ALTER TABLE discount_usage ADD CONSTRAINT check_discount_amount_non_negative CHECK (discount_amount >= 0);
ALTER TABLE discount_usage ADD CONSTRAINT check_commission_amount_non_negative CHECK (commission_amount >= 0);

-- Add comments
COMMENT ON TABLE subscriptions IS 'Tracks user subscriptions and payment information';
COMMENT ON TABLE discount_codes IS 'Tracks discount codes created by employees for referrals';
COMMENT ON TABLE discount_usage IS 'Tracks usage of discount codes and commission calculations';

COMMENT ON COLUMN subscriptions.plan_type IS 'Type of subscription plan: one_letter, four_monthly, eight_yearly';
COMMENT ON COLUMN subscriptions.amount IS 'Final amount charged after discounts';
COMMENT ON COLUMN subscriptions.original_amount IS 'Original subscription amount before discounts';
COMMENT ON COLUMN subscriptions.discount_amount IS 'Amount discounted from original price';

COMMENT ON COLUMN discount_codes.discount_percentage IS 'Percentage discount (1-100)';
COMMENT ON COLUMN discount_codes.employee_id IS 'Employee who created this discount code';
COMMENT ON COLUMN discount_codes.usage_count IS 'Number of times this code has been used';

COMMENT ON COLUMN discount_usage.commission_amount IS 'Commission earned by employee for this referral';
COMMENT ON COLUMN discount_usage.subscription_amount IS 'Original subscription amount before discount';
COMMENT ON COLUMN discount_usage.discount_amount IS 'Amount discounted from subscription';
