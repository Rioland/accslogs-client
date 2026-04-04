-- Run in Supabase SQL editor. Marketplace listing thumbnails come from category.
alter table public.socialmedia_account_category
  add column if not exists thumbnail_url text;

comment on column public.socialmedia_account_category.thumbnail_url is
  'Optional image URL for marketplace category row thumbnail';
