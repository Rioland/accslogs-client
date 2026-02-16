-- Database setup for AccsLogs: profiles table, RLS policies, and optional triggers
-- Run this entire script in the Supabase SQL editor.

begin;

-- 1) Profiles table (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  first_name text not null,
  last_name text,
  referral_code text,
  funds numeric(10,2) default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Public profile data for users (1:1 with auth.users).';
comment on column public.profiles.id is 'Matches auth.users.id';
comment on column public.profiles.funds is 'User funds balance';

-- 2) Maintain updated_at automatically
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

-- 3) Helpful index for referral lookups
create index if not exists profiles_referral_code_idx on public.profiles (referral_code);

-- 4) Enable Row Level Security and define policies
alter table public.profiles enable row level security;

-- Allow users to read their own profile
drop policy if exists "Allow read own profile" on public.profiles;
create policy "Allow read own profile" on public.profiles
for select
using (auth.uid() = id);

-- Allow users to insert only their own profile row
drop policy if exists "Allow insert own profile" on public.profiles;
create policy "Allow insert own profile" on public.profiles
for insert
with check (auth.uid() = id);

-- Allow users to update only their own profile row
drop policy if exists "Allow update own profile" on public.profiles;
create policy "Allow update own profile" on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Allow users to delete only their own profile row (optional)
drop policy if exists "Allow delete own profile" on public.profiles;
create policy "Allow delete own profile" on public.profiles
for delete
using (auth.uid() = id);

-- Allow admins to read all profiles
drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles" on public.profiles
for select to authenticated
using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- Allow admins to insert profiles (for creating users)
drop policy if exists "Admins can insert profiles" on public.profiles;
create policy "Admins can insert profiles" on public.profiles
for insert to authenticated
with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- Allow admins to update other profiles
drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles" on public.profiles
for update to authenticated
using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- Allow admins to delete other profiles
drop policy if exists "Admins can delete profiles" on public.profiles;
create policy "Admins can delete profiles" on public.profiles
for delete to authenticated
using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- OPTIONAL: If you want all authenticated users to read all profiles, uncomment below
-- drop policy if exists "Allow read profiles for authenticated" on public.profiles;
-- create policy "Allow read profiles for authenticated" on public.profiles
-- for select to authenticated
-- using (true);

-- 5) Optional: Auto-create a profile when a new auth user is created
-- If you enable this trigger, you may remove the client-side insert or keep it; the script
-- uses ON CONFLICT DO NOTHING to avoid duplicate key errors.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, referral_code)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    nullif(new.raw_user_meta_data->>'last_name', ''),
    nullif(new.raw_user_meta_data->>'referral_code', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Recreate trigger to hook into auth.users
-- Note: Requires replication permission granted by Supabase by default.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6) Admins table to store admin user IDs
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table public.admins is 'List of admin users allowed to manage certain resources.';

-- Enable RLS for admins
alter table public.admins enable row level security;

-- Allow users to check if they are admin (select their own row)
drop policy if exists "Users can check own admin status" on public.admins;
create policy "Users can check own admin status" on public.admins
for select
using (auth.uid() = user_id);

-- Allow admins to read all admin statuses
drop policy if exists "Admins can read all admins" on public.admins;
create policy "Admins can read all admins" on public.admins
for select to authenticated
using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- Allow admins to assign admin roles
drop policy if exists "Admins can insert admins" on public.admins;
create policy "Admins can insert admins" on public.admins
for insert to authenticated
with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- Allow admins to remove admin roles
drop policy if exists "Admins can delete admins" on public.admins;
create policy "Admins can delete admins" on public.admins
for delete to authenticated
using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- 7) Social media account category table
create table if not exists public.socialmedia_account_category (
  id bigserial primary key,
  name text not null unique,
  created_at timestamptz not null default now()
);

-- 8) Social media account subcategory table
create table if not exists public.socialmedia_account_subcategory (
  id bigserial primary key,
  category_id bigint not null references public.socialmedia_account_category(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

-- Seed categories (id auto-incremented)
insert into public.socialmedia_account_category (name) values
  ('facebook'),
  ('Instagram'),
  ('TikTok'),
  ('twitter or x'),
  ('linkedin'),
  ('texting app'),
  ('reddit'),
  ('snapchat'),
  ('discord'),
  ('pintrest'),
  ('vpn'),
  ('Netflix'),
  ('youtube'),
  ('proxy'),
  ('quora'),
  ('threads'),
  ('Emails'),
  ('apple'),
  ('prime videos'),
  ('Ai tools'),
  ('Tutorials')
 on conflict (name) do nothing;

-- Seed subcategories (assuming category ids after insert, but since on conflict do nothing, need to handle carefully)
-- For simplicity, insert some example subcategories for first few categories
-- Note: In production, you might want to insert after categories are seeded
insert into public.socialmedia_account_subcategory (category_id, name) values
  (1, 'Personal'),
  (1, 'Business'),
  (2, 'Personal'),
  (2, 'Business'),
  (3, 'Dance'),
  (3, 'Comedy'),
  (4, 'Personal'),
  (4, 'News')
 on conflict do nothing;

-- 9) Products table
create table if not exists public.products (
  id bigserial primary key,
  name text not null,
  price numeric(10,2) not null,
  quantity int not null default 0,
  description text,
  category_id bigint references public.socialmedia_account_category(id) on delete set null,
  subcategory_id bigint references public.socialmedia_account_subcategory(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 10) Product configurations table
create table if not exists public.product_configurations (
  id bigserial primary key,
  product_id bigint not null references public.products(id) on delete cascade,
  config_index int not null,
  config_data jsonb not null,
  created_at timestamptz not null default now()
);

-- Unique constraint for product_id and config_index
alter table public.product_configurations add constraint unique_product_config unique (product_id, config_index);

-- Enable RLS and policies: anyone can read; only admins can insert/update/delete
alter table public.socialmedia_account_category enable row level security;

drop policy if exists "Anyone can read categories" on public.socialmedia_account_category;
create policy "Anyone can read categories" on public.socialmedia_account_category
for select using (true);

-- Helper condition: current user is admin
-- We use an inline exists() check against public.admins table

drop policy if exists "Only admins can insert categories" on public.socialmedia_account_category;
create policy "Only admins can insert categories" on public.socialmedia_account_category
for insert to authenticated
with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));


drop policy if exists "Only admins can update categories" on public.socialmedia_account_category;
create policy "Only admins can update categories" on public.socialmedia_account_category
for update to authenticated
using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));


drop policy if exists "Only admins can delete categories" on public.socialmedia_account_category;
create policy "Only admins can delete categories" on public.socialmedia_account_category
for delete to authenticated
using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- Enable RLS and policies for subcategories: anyone can read; only admins can insert/update/delete
alter table public.socialmedia_account_subcategory enable row level security;

drop policy if exists "Anyone can read subcategories" on public.socialmedia_account_subcategory;
create policy "Anyone can read subcategories" on public.socialmedia_account_subcategory
for select using (true);

drop policy if exists "Only admins can insert subcategories" on public.socialmedia_account_subcategory;
create policy "Only admins can insert subcategories" on public.socialmedia_account_subcategory
for insert to authenticated
with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

drop policy if exists "Only admins can update subcategories" on public.socialmedia_account_subcategory;
create policy "Only admins can update subcategories" on public.socialmedia_account_subcategory
for update to authenticated
using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

drop policy if exists "Only admins can delete subcategories" on public.socialmedia_account_subcategory;
create policy "Only admins can delete subcategories" on public.socialmedia_account_subcategory
for delete to authenticated
using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- Enable RLS and policies for products: anyone can read; only admins can insert/update/delete
alter table public.products enable row level security;

drop policy if exists "Anyone can read products" on public.products;
create policy "Anyone can read products" on public.products
for select using (true);

drop policy if exists "Only admins can insert products" on public.products;
create policy "Only admins can insert products" on public.products
for insert to authenticated
with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

drop policy if exists "Only admins can update products" on public.products;
create policy "Only admins can update products" on public.products
for update to authenticated
using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

drop policy if exists "Only admins can delete products" on public.products;
create policy "Only admins can delete products" on public.products
for delete to authenticated
using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- Enable RLS and policies for product_configurations: anyone can read; only admins can insert/update/delete
alter table public.product_configurations enable row level security;

drop policy if exists "Anyone can read product_configurations" on public.product_configurations;
create policy "Anyone can read product_configurations" on public.product_configurations
for select using (true);

drop policy if exists "Only admins can insert product_configurations" on public.product_configurations;
create policy "Only admins can insert product_configurations" on public.product_configurations
for insert to authenticated
with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

drop policy if exists "Only admins can update product_configurations" on public.product_configurations;
create policy "Only admins can update product_configurations" on public.product_configurations
for update to authenticated
using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

drop policy if exists "Only admins can delete product_configurations" on public.product_configurations;
create policy "Only admins can delete product_configurations" on public.product_configurations
for delete to authenticated
using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

commit;

-- end of profile here
