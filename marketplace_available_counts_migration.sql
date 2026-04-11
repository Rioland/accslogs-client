-- Run in Supabase SQL editor.
-- Counts only inventory rows still for sale (buyer_id IS NULL), matching purchase_product logic.
-- Allows the public marketplace to show accurate stock without exposing credentials.

create or replace function public.marketplace_available_counts(p_ids bigint[])
returns table (product_id bigint, available_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    spa.product_id,
    count(*)::bigint as available_count
  from public.seller_product_accounts spa
  inner join public.seller_products sp on sp.id = spa.product_id
  where spa.product_id = any (p_ids)
    and spa.buyer_id is null
    and sp.status = 'approved'
  group by spa.product_id;
$$;

revoke all on function public.marketplace_available_counts (bigint[]) from public;
grant execute on function public.marketplace_available_counts (bigint[]) to anon, authenticated;
