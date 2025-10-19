-- Migration: Add missing columns to profiles table
-- Created: 2025-10-02
-- Purpose: Add employee and user subscription-related columns to profiles

-- Add missing columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS commission_earned DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'inactive' CHECK (subscription_status IN ('inactive', 'active', 'past_due', 'cancelled', 'unpaid'));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_coupon_code ON public.profiles(coupon_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Add constraints (drop first if exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_points_non_negative' AND conrelid = 'public.profiles'::regclass) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT check_points_non_negative CHECK (points >= 0);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_commission_non_negative' AND conrelid = 'public.profiles'::regclass) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT check_commission_non_negative CHECK (commission_earned >= 0);
    END IF;
END $$;

-- Add comments
COMMENT ON COLUMN public.profiles.points IS 'Points earned by employees for referrals and activities';
COMMENT ON COLUMN public.profiles.commission_earned IS 'Total commission earned by employees';
COMMENT ON COLUMN public.profiles.coupon_code IS 'Unique coupon code for employees';
COMMENT ON COLUMN public.profiles.referred_by IS 'User ID of the employee who referred this user';
COMMENT ON COLUMN public.profiles.subscription_status IS 'Current subscription status of the user';

-- Create function to generate unique coupon code for employees
CREATE OR REPLACE FUNCTION generate_employee_coupon_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate code in format: EMP-XXXXX (5 random uppercase alphanumeric characters)
        new_code := 'EMP-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 5));

        -- Check if code exists
        SELECT EXISTS(SELECT 1 FROM public.profiles WHERE coupon_code = new_code) INTO code_exists;

        -- Exit loop if code is unique
        EXIT WHEN NOT code_exists;
    END LOOP;

    RETURN new_code;
END;
$$;

-- Update handle_new_user function to include new columns
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    user_role TEXT;
    generated_coupon TEXT;
BEGIN
    -- Get role from metadata, default to 'user'
    user_role := pg_catalog.coalesce(new.raw_user_meta_data->>'role', 'user');

    -- Generate coupon code if user is an employee
    IF user_role = 'employee' THEN
        generated_coupon := generate_employee_coupon_code();
    ELSE
        generated_coupon := NULL;
    END IF;

    -- Insert profile with all fields
    INSERT INTO public.profiles (
        id,
        email,
        role,
        points,
        commission_earned,
        coupon_code,
        subscription_status
    )
    VALUES (
        new.id,
        new.email,
        user_role,
        CASE WHEN user_role = 'employee' THEN 0 ELSE NULL END,
        CASE WHEN user_role = 'employee' THEN 0 ELSE NULL END,
        generated_coupon,
        'inactive'
    );

    RETURN new;
END;
$$;

-- Revoke execute permissions on new function from public roles for security
REVOKE EXECUTE ON FUNCTION generate_employee_coupon_code() FROM anon, authenticated;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;

COMMENT ON FUNCTION generate_employee_coupon_code() IS 'Generates a unique coupon code for employees';
