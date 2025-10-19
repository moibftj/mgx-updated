-- Add 'generating' step to timeline status constraint
-- This ensures the 4-step workflow: received → under_review → generating → posted

ALTER TABLE letters 
  DROP CONSTRAINT IF EXISTS letters_timeline_status_check;

ALTER TABLE letters
  ADD CONSTRAINT letters_timeline_status_check
    CHECK (timeline_status IN ('received', 'under_review', 'generating', 'posted'));

-- Add indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_letters_user_id ON letters(user_id);
CREATE INDEX IF NOT EXISTS idx_letters_status ON letters(status);
CREATE INDEX IF NOT EXISTS idx_letters_timeline_status ON letters(timeline_status);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_letter_id ON coupon_usage(letter_id);

-- Create or update affiliate stats RPC function for commission tracking
CREATE OR REPLACE FUNCTION update_affiliate_stats(
  employee_id uuid,
  commission_earned numeric,
  points_earned integer
)
RETURNS void AS $$
BEGIN
  INSERT INTO affiliate_stats (employee_id, total_earnings, points_balance)
    VALUES (employee_id, commission_earned, points_earned)
    ON CONFLICT (employee_id) 
      DO UPDATE SET
        total_earnings = affiliate_stats.total_earnings + commission_earned,
        points_balance = affiliate_stats.points_balance + points_earned,
        updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
