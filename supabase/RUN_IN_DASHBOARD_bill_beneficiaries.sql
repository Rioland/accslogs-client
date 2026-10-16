-- ===========================================================================
-- Saved bill-payment beneficiaries — run this in the Supabase SQL Editor.
-- Safe to re-run (if not exists / drop policy if exists).
-- Same as supabase/migrations/20261016120000_bill_beneficiaries.sql
-- ===========================================================================

-- Saved bill-payment beneficiaries: phone numbers, meters, smartcards and
-- betting accounts a customer has paid before, so they can pick them instead
-- of retyping. One row per (user, product, provider, customer number).
--
-- Customers manage their own rows directly through the browser client; RLS
-- scopes every operation to auth.uid(). Nothing here touches money, so no
-- server route or SECURITY DEFINER function is involved.

create table if not exists public.bill_beneficiaries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  product_type  text not null check (
    product_type in ('airtime', 'data', 'electricity', 'tv', 'betting')
  ),
  -- Network, disco, TV provider or bookmaker.
  service_id    text not null check (char_length(service_id) between 1 and 64),
  -- Phone number, meter number, smartcard/IUC or betting account ID.
  customer_id   text not null check (char_length(customer_id) between 1 and 64),
  -- Electricity: prepaid/postpaid. Data/TV: the last plan bought, used to
  -- pre-select it next time if it is still on sale.
  variation_id  text check (variation_id is null or char_length(variation_id) <= 64),
  nickname      text check (nickname is null or char_length(nickname) <= 60),
  -- Name returned by the provider's verify call, shown on the chip.
  customer_name text check (customer_name is null or char_length(customer_name) <= 120),
  last_used_at  timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  unique (user_id, product_type, service_id, customer_id)
);

create index if not exists bill_beneficiaries_user_idx
  on public.bill_beneficiaries (user_id, product_type, last_used_at desc);

alter table public.bill_beneficiaries enable row level security;

drop policy if exists "Users can read own beneficiaries" on public.bill_beneficiaries;
create policy "Users can read own beneficiaries"
  on public.bill_beneficiaries
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can add own beneficiaries" on public.bill_beneficiaries;
create policy "Users can add own beneficiaries"
  on public.bill_beneficiaries
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own beneficiaries" on public.bill_beneficiaries;
create policy "Users can update own beneficiaries"
  on public.bill_beneficiaries
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own beneficiaries" on public.bill_beneficiaries;
create policy "Users can delete own beneficiaries"
  on public.bill_beneficiaries
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Supabase's default privileges grant anon full table access; RLS would block
-- it anyway, but anon has no business here at all.
revoke all on public.bill_beneficiaries from anon;
grant select, insert, update, delete on public.bill_beneficiaries to authenticated;
