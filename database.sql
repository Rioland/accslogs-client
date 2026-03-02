-- Database setup forTopnotchlogs: profiles table, RLS policies, and optional triggers
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

-- Drop problematic policy if exists
drop policy if exists "Admins can read all admins" on public.admins;

-- Allow users to check if they are admin (select their own row)
drop policy if exists "Users can check own admin status" on public.admins;
create policy "Users can check own admin status" on public.admins
for select
using (auth.uid() = user_id);

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
-- alter table public.products enable row level security;

-- drop policy if exists "Anyone can read products" on public.products;
-- create policy "Anyone can read products" on public.products
-- for select using (true);

-- drop policy if exists "Only admins can insert products" on public.products;
-- create policy "Only admins can insert products" on public.products
-- for insert to authenticated
-- with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- drop policy if exists "Only admins can update products" on public.products;
-- create policy "Only admins can update products" on public.products
-- for update to authenticated
-- using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
-- with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- drop policy if exists "Only admins can delete products" on public.products;
-- create policy "Only admins can delete products" on public.products
-- for delete to authenticated
-- using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

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

-- Drop old tables if exist
drop table if exists public.seller_product_accounts cascade;
drop table if exists public.seller_accounts cascade;

-- 11) Seller products table
create table if not exists public.seller_products (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  subcategory text,
  name text not null,
  description text,
  price numeric(10,2) not null,
  release_option text not null check (release_option in ('auto', 'manual')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 12) Seller product accounts table
create table if not exists public.seller_product_accounts (
  id bigserial primary key,
  product_id bigint not null references public.seller_products(id) on delete cascade,
  username text not null,
  password text not null,
  email text,
  email_password text,
  additional_info text,
  preview_link text,
  created_at timestamptz not null default now()
);

-- Maintain updated_at for seller_products
drop trigger if exists set_updated_at_seller_products on public.seller_products;
create trigger set_updated_at_seller_products before update on public.seller_products
for each row execute function public.set_updated_at();

-- Enable RLS for seller_products
alter table public.seller_products enable row level security;

-- Users can read their own submitted products
drop policy if exists "Users can read own seller products" on public.seller_products;
create policy "Users can read own seller products" on public.seller_products
for select
using (auth.uid() = user_id);

-- Users can insert their own seller products
drop policy if exists "Users can insert own seller products" on public.seller_products;
create policy "Users can insert own seller products" on public.seller_products
for insert to authenticated
with check (auth.uid() = user_id);

-- Users can update their own pending seller products
drop policy if exists "Users can update own pending seller products" on public.seller_products;
create policy "Users can update own pending seller products" on public.seller_products
for update to authenticated
using (auth.uid() = user_id and status = 'pending')
with check (auth.uid() = user_id and status = 'pending');

-- Admins can read all seller products
drop policy if exists "Admins can read all seller products" on public.seller_products;
create policy "Admins can read all seller products" on public.seller_products
for select to authenticated
using (true);

-- Admins can update seller products (approve/reject)
drop policy if exists "Admins can update seller products" on public.seller_products;
create policy "Admins can update seller products" on public.seller_products
for update to authenticated
using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- Admins can delete seller products
drop policy if exists "Admins can delete seller products" on public.seller_products;
create policy "Admins can delete seller products" on public.seller_products
for delete to authenticated
using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- Enable RLS for seller_product_accounts
alter table public.seller_product_accounts enable row level security;

-- Users can read accounts for their own products
drop policy if exists "Users can read accounts for own products" on public.seller_product_accounts;
create policy "Users can read accounts for own products" on public.seller_product_accounts
for select
using (exists (select 1 from public.seller_products p where p.id = product_id and p.user_id = auth.uid()));

-- Users can insert accounts for their own pending products
drop policy if exists "Users can insert accounts for own pending products" on public.seller_product_accounts;
create policy "Users can insert accounts for own pending products" on public.seller_product_accounts
for insert to authenticated
with check (exists (select 1 from public.seller_products p where p.id = product_id and p.user_id = auth.uid() and p.status = 'pending'));

-- Admins can insert accounts to any product
drop policy if exists "Admins can insert accounts to any product" on public.seller_product_accounts;
create policy "Admins can insert accounts to any product" on public.seller_product_accounts
for insert to authenticated
with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- Users can update accounts for their own pending products
drop policy if exists "Users can update accounts for own pending products" on public.seller_product_accounts;
create policy "Users can update accounts for own pending products" on public.seller_product_accounts
for update to authenticated
using (exists (select 1 from public.seller_products p where p.id = product_id and p.user_id = auth.uid() and p.status = 'pending'))
with check (exists (select 1 from public.seller_products p where p.id = product_id and p.user_id = auth.uid() and p.status = 'pending'));

-- Admins can read all seller product accounts
drop policy if exists "Admins can read all seller product accounts" on public.seller_product_accounts;
create policy "Admins can read all seller product accounts" on public.seller_product_accounts
for select to authenticated
using (true);

-- Admins can update seller product accounts
drop policy if exists "Admins can update seller product accounts" on public.seller_product_accounts;
create policy "Admins can update seller product accounts" on public.seller_product_accounts
for update to authenticated
using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- Admins can delete seller product accounts
drop policy if exists "Admins can delete seller product accounts" on public.seller_product_accounts;
create policy "Admins can delete seller product accounts" on public.seller_product_accounts
for delete to authenticated
using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- 13) Product orders table
create table if not exists public.product_orders (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id bigint not null references public.seller_products(id) on delete cascade,
  quantity int not null default 1,
  promo_code text,
  discount numeric(10,2) default 0,
  grand_total numeric(10,2) not null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'cancelled', 'refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Maintain updated_at for product_orders
drop trigger if exists set_updated_at_product_orders on public.product_orders;
create trigger set_updated_at_product_orders before update on public.product_orders
for each row execute function public.set_updated_at();

-- Enable RLS for product_orders
alter table public.product_orders enable row level security;

-- Users can read their own orders
drop policy if exists "Users can read own orders" on public.product_orders;
create policy "Users can read own orders" on public.product_orders
for select
using (auth.uid() = user_id);

-- Users can insert their own orders
drop policy if exists "Users can insert own orders" on public.product_orders;
create policy "Users can insert own orders" on public.product_orders
for insert to authenticated
with check (auth.uid() = user_id);

-- 14) Add buyer_id column to seller_product_accounts
alter table public.seller_product_accounts add column if not exists buyer_id uuid references auth.users(id) on delete set null;

-- Add index for buyer_id
create index if not exists seller_product_accounts_buyer_id_idx on public.seller_product_accounts (buyer_id);

-- Users can read accounts they purchased
drop policy if exists "Users can read purchased accounts" on public.seller_product_accounts;
create policy "Users can read purchased accounts" on public.seller_product_accounts
for select
using (auth.uid() = buyer_id);

commit;

-- 15) purchase_product RPC — atomic purchase: check balance, deduct, create order, assign accounts
create or replace function public.purchase_product(
  p_product_id bigint,
  p_quantity    int,
  p_grand_total numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id        uuid    := auth.uid();
  v_funds          numeric;
  v_order_id       bigint;
  v_assigned_count int;
begin
  -- Must be authenticated
  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', 'Not authenticated');
  end if;

  -- Lock the profile row and read current funds
  select funds
    into v_funds
    from public.profiles
   where id = v_user_id
     for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Profile not found');
  end if;

  -- Check sufficient balance
  if v_funds < p_grand_total then
    return jsonb_build_object('success', false, 'error', 'Insufficient balance');
  end if;

  -- Check enough unassigned accounts exist
  select count(*)
    into v_assigned_count
    from public.seller_product_accounts
   where product_id = p_product_id
     and buyer_id is null;

  if v_assigned_count < p_quantity then
    return jsonb_build_object('success', false, 'error', 'Not enough accounts in stock');
  end if;

  -- Deduct funds
  update public.profiles
     set funds = funds - p_grand_total
   where id = v_user_id;

  -- Create order (status = completed immediately after payment)
  insert into public.product_orders
    (user_id, product_id, quantity, grand_total, status)
  values
    (v_user_id, p_product_id, p_quantity, p_grand_total, 'completed')
  returning id into v_order_id;

  -- Assign accounts to buyer (skip locked rows to avoid race conditions)
  with accounts_to_assign as (
    select id
      from public.seller_product_accounts
     where product_id = p_product_id
       and buyer_id is null
     limit p_quantity
       for update skip locked
  )
  update public.seller_product_accounts spa
     set buyer_id = v_user_id
    from accounts_to_assign a
   where spa.id = a.id;

  get diagnostics v_assigned_count = row_count;

  return jsonb_build_object(
    'success',          true,
    'order_id',         v_order_id,
    'accounts_assigned', v_assigned_count
  );
end;
$$;

-- Grant execute to authenticated users
grant execute on function public.purchase_product(bigint, int, numeric) to authenticated;

-- end of profile here
