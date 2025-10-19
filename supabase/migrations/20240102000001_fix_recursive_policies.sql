-- Fix the recursive policies
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;

-- Create new policies without recursion
create policy "Enable read access for users" on public.profiles
  for select using (
    auth.uid() = id or -- users can view their own profile
    auth.jwt()->>'role' = 'admin' -- admins can view all profiles
  );

create policy "Enable update for users" on public.profiles
  for update using (auth.uid() = id);

-- Allow insert during signup
create policy "Enable insert for authenticated users" on public.profiles
  for insert with check (auth.uid() = id);

-- Recreate letter policies
drop policy if exists "Users can view own letters" on public.letters;
drop policy if exists "Users can insert own letters" on public.letters;
drop policy if exists "Users can update own letters" on public.letters;
drop policy if exists "Users can delete own letters" on public.letters;
drop policy if exists "Admins can view all letters" on public.letters;

create policy "Enable read access for users" on public.letters
  for select using (
    user_id = auth.uid() or -- users can view their own letters
    auth.jwt()->>'role' = 'admin' -- admins can view all letters
  );

create policy "Enable insert for users" on public.letters
  for insert with check (user_id = auth.uid());

create policy "Enable update for users" on public.letters
  for update using (user_id = auth.uid());

create policy "Enable delete for users" on public.letters
  for delete using (user_id = auth.uid());