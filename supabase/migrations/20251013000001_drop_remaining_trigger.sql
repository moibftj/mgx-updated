-- Clean up remaining handle_new_user trigger
-- Created: 2025-10-13

-- Drop the handle_new_user trigger and function if they exist
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS handle_new_user();

-- Drop any other common trigger variations
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS new_user_trigger ON auth.users;

-- Also check for the function in different schemas
DROP FUNCTION IF EXISTS auth.handle_new_user();