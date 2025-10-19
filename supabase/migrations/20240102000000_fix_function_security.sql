-- Fix function search path security vulnerabilities
-- This migration updates existing trigger functions with secure search_path settings

-- Update handle_new_user function with empty search_path for maximum security
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    pg_catalog.coalesce(new.raw_user_meta_data->>'role', 'user')
  );
  return new;
end;
$$;

-- Update handle_updated_at function with empty search_path for maximum security
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Use pg_catalog.timezone for fully qualified reference
  new.updated_at = pg_catalog.timezone('utc'::text, pg_catalog.now());
  return new;
end;
$$;

-- Revoke execute permissions on trigger functions from public roles for security
-- This prevents direct execution while allowing triggers to work
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.handle_updated_at() from anon, authenticated;