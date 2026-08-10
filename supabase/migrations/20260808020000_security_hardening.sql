-- Security hardening: closes four independently exploitable privilege holes.
--
-- 1. seller_product_accounts / seller_products: policies named "Admins can
--    read all" whose predicate was `using (true)`, which OR-ed away every
--    restrictive policy on those tables.
-- 2. profiles: RLS scopes the row but not the column, so `funds` was writable
--    by its owner. Column-level grants are the only way to express this.
-- 3. webhook_process_deposit: a SECURITY DEFINER wallet-credit function that
--    was granted to anon.
-- 4. bill_payment_*: `revoke ... from public` does not remove the explicit
--    role grants Supabase's default privileges already issued.

begin;

-- 1a) Restrict seller_products reads to actual admins.
drop policy if exists "Admins can read all seller products" on public.seller_products;
create policy "Admins can read all seller products" on public.seller_products
for select to authenticated
using (
  exists (
    select 1 from public.admins a where a.user_id = (select auth.uid())
  )
);

-- The permissive policy above was also what made the marketplace work. Replace
-- that side effect with an explicit, intentional policy: approved listings are
-- public, pending and rejected submissions are not.
drop policy if exists "Anyone can read approved seller products" on public.seller_products;
create policy "Anyone can read approved seller products" on public.seller_products
for select to anon, authenticated
using (status = 'approved');

-- 1b) Restrict credential reads to actual admins. Sellers keep access to their
-- own products and buyers to what they purchased via the existing policies.
-- Marketplace stock counts come from marketplace_available_counts (SECURITY
-- DEFINER), so they are unaffected.
drop policy if exists "Admins can read all seller product accounts" on public.seller_product_accounts;
create policy "Admins can read all seller product accounts" on public.seller_product_accounts
for select to authenticated
using (
  exists (
    select 1 from public.admins a where a.user_id = (select auth.uid())
  )
);

-- 2) Take away blanket UPDATE on profiles, then hand back only the columns a
-- user legitimately edits. `funds` is deliberately absent: all balance changes
-- must go through SECURITY DEFINER functions or the service role.
-- korapay_customer_id and account_reference are intentionally excluded too:
-- they are now written by the service role in lib/korapayServer.ts.
revoke update on public.profiles from anon, authenticated;
grant update (first_name, last_name, referral_code) on public.profiles to authenticated;

-- Backstop so a negative-amount bug can never drive a balance below zero.
-- NOT VALID enforces on new writes without failing on pre-existing rows.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_funds_non_negative'
  ) then
    alter table public.profiles
      add constraint profiles_funds_non_negative check (funds >= 0) not valid;
  end if;
end;
$$;

-- 3 & 4) Strip the public key's access to every function that can move money.
-- Guarded by a catalog lookup so this migration is safe to run against a
-- database where a given function has not been created yet.
do $$
declare
  fn text;
  money_functions text[] := array[
    'public.webhook_process_deposit(uuid, numeric, text, text, jsonb)',
    'public.bill_payment_debit(uuid, text, text, text, text, text, numeric)',
    'public.bill_payment_complete(text, text, numeric, numeric, text, text, jsonb)',
    'public.bill_payment_fail_and_refund(text, text, jsonb)'
  ];
begin
  foreach fn in array money_functions loop
    if to_regprocedure(fn) is not null then
      execute format('revoke execute on function %s from public, anon, authenticated', fn);
    end if;
  end loop;
end;
$$;

commit;
