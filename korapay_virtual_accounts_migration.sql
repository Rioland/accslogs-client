-- Migration: Store Korapay virtual account details
-- Run this in Supabase SQL editor.

begin;

-- Create user_virtual_accounts table for dedicated account details from Korapay
create table if not exists public.user_virtual_accounts (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  account_name text not null,
  account_number text not null,
  bank_code text not null,
  bank_name text not null,
  account_reference text not null unique,
  korapay_unique_id text not null,
  account_status text not null default 'active',
  currency text not null default 'NGN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

comment on table public.user_virtual_accounts is 'Korapay dedicated virtual account details per user';

-- Index for lookups
create index if not exists user_virtual_accounts_user_id_idx on public.user_virtual_accounts (user_id);
create index if not exists user_virtual_accounts_account_reference_idx on public.user_virtual_accounts (account_reference);

-- Maintain updated_at
drop trigger if exists set_updated_at_user_virtual_accounts on public.user_virtual_accounts;
create trigger set_updated_at_user_virtual_accounts before update on public.user_virtual_accounts
for each row execute function public.set_updated_at();

-- RLS
alter table public.user_virtual_accounts enable row level security;

-- Users can read their own
drop policy if exists "Users can read own virtual accounts" on public.user_virtual_accounts;
create policy "Users can read own virtual accounts" on public.user_virtual_accounts
for select using (auth.uid() = user_id);

-- Users can insert their own (via app/server)
drop policy if exists "Users can insert own virtual accounts" on public.user_virtual_accounts;
create policy "Users can insert own virtual accounts" on public.user_virtual_accounts
for insert to authenticated with check (auth.uid() = user_id);

-- Users can update their own (in case of sync)
drop policy if exists "Users can update own virtual accounts" on public.user_virtual_accounts;
create policy "Users can update own virtual accounts" on public.user_virtual_accounts
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Admins can read all
drop policy if exists "Admins can read all virtual accounts" on public.user_virtual_accounts;
create policy "Admins can read all virtual accounts" on public.user_virtual_accounts
for select to authenticated
using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

commit;
