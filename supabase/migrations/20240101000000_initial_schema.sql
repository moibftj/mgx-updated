-- Enable Row Level Security
alter default privileges revoke execute on functions from public;

-- Create profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  role text check (role in ('user', 'employee', 'admin')) not null default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create letters table
create table if not exists public.letters (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  letter_type text not null,
  content text,
  ai_draft text,
  status text check (status in ('draft', 'completed', 'sent')) not null default 'draft',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.letters enable row level security;

-- Create RLS policies for profiles (using DO blocks to handle existing policies)
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'Users can view own profile') then
    create policy "Users can view own profile" on public.profiles
      for select using (auth.uid() = id);
  end if;

  if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'Users can update own profile') then
    create policy "Users can update own profile" on public.profiles
      for update using (auth.uid() = id);
  end if;

  if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'Admins can view all profiles') then
    create policy "Admins can view all profiles" on public.profiles
      for select using (
        exists (
          select 1 from public.profiles
          where id = auth.uid() and role = 'admin'
        )
      );
  end if;
end $$;

-- Create RLS policies for letters (using DO blocks to handle existing policies)
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'letters' and policyname = 'Users can view own letters') then
    create policy "Users can view own letters" on public.letters
      for select using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where tablename = 'letters' and policyname = 'Users can insert own letters') then
    create policy "Users can insert own letters" on public.letters
      for insert with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where tablename = 'letters' and policyname = 'Users can update own letters') then
    create policy "Users can update own letters" on public.letters
      for update using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where tablename = 'letters' and policyname = 'Users can delete own letters') then
    create policy "Users can delete own letters" on public.letters
      for delete using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where tablename = 'letters' and policyname = 'Admins can view all letters') then
    create policy "Admins can view all letters" on public.letters
      for select using (
        exists (
          select 1 from public.profiles
          where id = auth.uid() and role = 'admin'
        )
      );
  end if;
end $$;

-- Create function to handle new user registration
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

-- Create trigger for new user registration
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create function to update updated_at timestamp
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

-- Create triggers for updated_at (drop and recreate to handle existing triggers)
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

drop trigger if exists letters_updated_at on public.letters;
create trigger letters_updated_at
  before update on public.letters
  for each row execute procedure public.handle_updated_at();

-- Revoke execute permissions on trigger functions from public roles for security
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.handle_updated_at() from anon, authenticated;

-- Grant necessary permissions
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
grant all on all functions in schema public to anon, authenticated;

-- Re-revoke execute on trigger functions after the general grant
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.handle_updated_at() from anon, authenticated;