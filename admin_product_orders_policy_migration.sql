-- Run in Supabase SQL editor.
-- Allows authenticated admins to manage all customer purchase transactions.

alter table public.product_orders enable row level security;

drop policy if exists "Admins can read all product orders" on public.product_orders;
create policy "Admins can read all product orders" on public.product_orders
for select to authenticated
using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

drop policy if exists "Admins can update all product orders" on public.product_orders;
create policy "Admins can update all product orders" on public.product_orders
for update to authenticated
using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));
