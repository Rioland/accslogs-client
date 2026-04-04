-- Thumbnail image URL for marketplace product cards (admin sell flow).
-- Run in Supabase SQL Editor once.

alter table public.seller_products
  add column if not exists thumbnail_url text;

comment on column public.seller_products.thumbnail_url is 'Optional image URL for product listing thumbnail';
