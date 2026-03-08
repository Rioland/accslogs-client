-- Migration for Ad Funds feature: Add account_number to profiles and create deposits table
-- Run this in Supabase SQL editor after existing schema.

begin;

-- Add korapay_customer_id and account_reference to profiles (for Korapay dedicated virtual accounts)
alter table public.profiles
  add column if not exists korapay_customer_id text,
  add column if not exists account_reference text,



comment on column public.profiles.korapay_customer_id is 'Korapay customer ID for linking dedicated virtual accounts';
comment on column public.profiles.account_reference is 'Korapay account reference for linking dedicated virtual accounts';

-- Create deposits table for transaction history
create table if not exists public.deposits (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(10,2) not null,
  reference text not null unique,
  status text not null default 'pending' check (status in ('pending', 'successful', 'failed')),
  korapay_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.deposits is 'Deposit transactions via Korapay virtual accounts';

-- Maintain updated_at for deposits
drop trigger if exists set_updated_at_deposits on public.deposits;
create trigger set_updated_at_deposits before update on public.deposits
for each row execute function public.set_updated_at();

-- Index for user deposits
create index if not exists deposits_user_id_idx on public.deposits (user_id);
create index if not exists deposits_reference_idx on public.deposits (reference);

-- Enable RLS for deposits
alter table public.deposits enable row level security;

-- Users can read their own deposits
drop policy if exists "Users can read own deposits" on public.deposits;
create policy "Users can read own deposits" on public.deposits
for select
using (auth.uid() = user_id);

-- Users can insert their own deposits (for webhook processing)
drop policy if exists "Users can insert own deposits" on public.deposits;
create policy "Users can insert own deposits" on public.deposits
for insert to authenticated
with check (auth.uid() = user_id);

-- Admins can read all deposits
drop policy if exists "Admins can read all deposits" on public.deposits;
create policy "Admins can read all deposits" on public.deposits
for select to authenticated
using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- Allow service role to insert deposits (for webhooks)
-- Service role bypasses RLS by default

commit;