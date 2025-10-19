-- Migration: Add letter status tracking and history
-- Created: 2024-09-20

-- Create letter_status_history table to track all status changes
CREATE TABLE IF NOT EXISTS letter_status_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    letter_id UUID NOT NULL REFERENCES letters(id) ON DELETE CASCADE,
    old_status VARCHAR(20) NOT NULL,
    new_status VARCHAR(20) NOT NULL,
    changed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notes TEXT,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_letter_status_history_letter_id ON letter_status_history(letter_id);
CREATE INDEX IF NOT EXISTS idx_letter_status_history_changed_at ON letter_status_history(changed_at);
CREATE INDEX IF NOT EXISTS idx_letter_status_history_changed_by ON letter_status_history(changed_by);

-- Add admin_notes column to letters table
ALTER TABLE letters ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Update letter status enum to include all new statuses
ALTER TABLE letters DROP CONSTRAINT IF EXISTS letters_status_check;
ALTER TABLE letters ADD CONSTRAINT letters_status_check
    CHECK (status IN ('draft', 'submitted', 'in_review', 'approved', 'completed', 'cancelled'));

-- Add lawyer assignment functionality
ALTER TABLE letters ADD COLUMN IF NOT EXISTS assigned_lawyer_id UUID REFERENCES auth.users(id);
ALTER TABLE letters ADD COLUMN IF NOT EXISTS due_date_internal DATE;
CREATE INDEX IF NOT EXISTS idx_letters_assigned_lawyer ON letters(assigned_lawyer_id);
CREATE INDEX IF NOT EXISTS idx_letters_due_date_internal ON letters(due_date_internal);

-- Enable RLS on letter_status_history
ALTER TABLE letter_status_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for letter_status_history (drop existing first)

-- Users can view history of their own letters
DROP POLICY IF EXISTS "Users can view their letter status history" ON letter_status_history;
CREATE POLICY "Users can view their letter status history"
    ON letter_status_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM letters
            WHERE letters.id = letter_status_history.letter_id
            AND letters.user_id = auth.uid()
        )
    );

-- Admins and lawyers can view all history
DROP POLICY IF EXISTS "Admins and lawyers can view all letter status history" ON letter_status_history;
CREATE POLICY "Admins and lawyers can view all letter status history"
    ON letter_status_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.uid() = auth.users.id
            AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'lawyer')
        )
    );

-- System can insert status history records
DROP POLICY IF EXISTS "System can insert status history" ON letter_status_history;
CREATE POLICY "System can insert status history"
    ON letter_status_history FOR INSERT
    WITH CHECK (true);

-- Admins can update/delete history records
DROP POLICY IF EXISTS "Admins can manage status history" ON letter_status_history;
CREATE POLICY "Admins can manage status history"
    ON letter_status_history FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.uid() = auth.users.id
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Update existing letters RLS policies to include lawyer role

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can view their own letters" ON letters;
DROP POLICY IF EXISTS "Users can insert their own letters" ON letters;
DROP POLICY IF EXISTS "Users can update their own letters" ON letters;

-- Recreate with lawyer access
CREATE POLICY "Users can view their own letters"
    ON letters FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Assigned lawyers can view letters"
    ON letters FOR SELECT
    USING (
        assigned_lawyer_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.uid() = auth.users.id
            AND auth.users.raw_user_meta_data->>'role' = 'lawyer'
        )
    );

CREATE POLICY "Users can insert their own letters"
    ON letters FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own letters"
    ON letters FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Lawyers can update assigned letters"
    ON letters FOR UPDATE
    USING (
        assigned_lawyer_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.uid() = auth.users.id
            AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'lawyer')
        )
    );

-- Function to automatically create status history on letter updates
CREATE OR REPLACE FUNCTION create_letter_status_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create history record if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO letter_status_history (
            letter_id,
            old_status,
            new_status,
            changed_by,
            changed_at
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            auth.uid(),
            NOW()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic status history
DROP TRIGGER IF EXISTS letter_status_change_trigger ON letters;
CREATE TRIGGER letter_status_change_trigger
    AFTER UPDATE ON letters
    FOR EACH ROW
    EXECUTE FUNCTION create_letter_status_history();

-- Create function to get letter status timeline
CREATE OR REPLACE FUNCTION get_letter_status_timeline(letter_uuid UUID)
RETURNS TABLE (
    id UUID,
    old_status VARCHAR,
    new_status VARCHAR,
    changed_by UUID,
    changed_by_email TEXT,
    changed_by_role TEXT,
    notes TEXT,
    changed_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        lsh.id,
        lsh.old_status,
        lsh.new_status,
        lsh.changed_by,
        u.email as changed_by_email,
        u.raw_user_meta_data->>'role' as changed_by_role,
        lsh.notes,
        lsh.changed_at
    FROM letter_status_history lsh
    JOIN auth.users u ON lsh.changed_by = u.id
    WHERE lsh.letter_id = letter_uuid
    ORDER BY lsh.changed_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_letter_status_timeline(UUID) TO authenticated;

-- Add comments
COMMENT ON TABLE letter_status_history IS 'Tracks all status changes for letters with timestamps and user info';
COMMENT ON COLUMN letter_status_history.changed_by IS 'User who made the status change (admin, lawyer, or system)';
COMMENT ON COLUMN letters.admin_notes IS 'Internal notes visible only to admins and lawyers';
COMMENT ON COLUMN letters.assigned_lawyer_id IS 'Lawyer assigned to review this letter';
COMMENT ON COLUMN letters.due_date_internal IS 'Internal due date for letter completion';

COMMENT ON FUNCTION create_letter_status_history() IS 'Automatically creates status history records when letter status changes';
COMMENT ON FUNCTION get_letter_status_timeline(UUID) IS 'Returns complete status timeline for a letter with user information';