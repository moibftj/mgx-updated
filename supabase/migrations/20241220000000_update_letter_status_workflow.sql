-- Update letters table status check constraint to match new workflow
ALTER TABLE public.letters
DROP CONSTRAINT IF EXISTS letters_status_check;

ALTER TABLE public.letters
ADD CONSTRAINT letters_status_check
CHECK (status IN ('draft', 'submitted', 'in_review', 'approved', 'completed', 'cancelled'));

-- Update default status for new letters to 'submitted' (Request received)
ALTER TABLE public.letters
ALTER COLUMN status SET DEFAULT 'submitted';