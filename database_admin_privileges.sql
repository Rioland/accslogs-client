-- Admin privileges schema and default super admin setup
-- Run this after database.sql in Supabase SQL editor.
-- Then use the bootstrap API (POST /api/bootstrap) to create the first super admin.

begin;

-- 1) Admin privileges lookup table
create table if not exists public.admin_privileges (
  id smallserial primary key,
  slug text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

comment on table public.admin_privileges is 'Defines available admin privilege types.';

insert into public.admin_privileges (slug, name, description) values
  ('manage_users', 'Manage Users', 'Create, edit, delete users and assign admin roles'),
  ('manage_categories', 'Manage Categories', 'Create, edit, delete categories and subcategories'),
  ('manage_sell_accounts', 'Manage Sell Accounts', 'Approve, reject, edit seller products and accounts'),
  ('manage_products', 'Manage Products', 'Manage product catalog and configurations'),
  ('manage_settings', 'Manage Settings', 'Access and modify system settings'),
  ('view_reports', 'View Reports', 'View analytics and reports'),
  ('full_access', 'Full Access', 'All privileges - super admin level')
on conflict (slug) do nothing;

-- 2) Add columns to admins table (migration for existing admins)
alter table public.admins
  add column if not exists is_super_admin boolean not null default false,
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

comment on column public.admins.is_super_admin is 'When true, admin has all privileges and can manage other admins.';

-- 3) Admin privilege assignments (for non-super-admins)
create table if not exists public.admin_privilege_assignments (
  admin_user_id uuid not null references auth.users(id) on delete cascade,
  privilege_id smallint not null references public.admin_privileges(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (admin_user_id, privilege_id)
);

comment on table public.admin_privilege_assignments is 'Assigns specific privileges to admin users (ignored when is_super_admin).';

-- Trigger for admins updated_at
drop trigger if exists set_updated_at_admins on public.admins;
create trigger set_updated_at_admins before update on public.admins
for each row execute function public.set_updated_at();

-- 4) Helper: check if user is super admin
create or replace function public.is_super_admin(uid uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select a.is_super_admin from public.admins a where a.user_id = uid),
    false
  );
$$;

-- 5) Helper: check if user has privilege (super admin has all)
create or replace function public.admin_has_privilege(
  uid uuid,
  priv_slug text
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select (
    -- Super admin has all privileges
    exists (select 1 from public.admins a where a.user_id = uid and a.is_super_admin)
    or
    -- Or has the specific privilege assigned
    exists (
      select 1 from public.admin_privilege_assignments apa
      join public.admin_privileges ap on ap.id = apa.privilege_id
      where apa.admin_user_id = uid and ap.slug = priv_slug
    )
    or
    -- Or has full_access privilege
    exists (
      select 1 from public.admin_privilege_assignments apa
      join public.admin_privileges ap on ap.id = apa.privilege_id
      where apa.admin_user_id = uid and ap.slug = 'full_access'
    )
  );
$$;

-- Enable RLS for admin_privileges (read-only for admins)
alter table public.admin_privileges enable row level security;

drop policy if exists "Admins can read privileges" on public.admin_privileges;
create policy "Admins can read privileges" on public.admin_privileges
for select to authenticated
using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- Enable RLS for admin_privilege_assignments
alter table public.admin_privilege_assignments enable row level security;

drop policy if exists "Admins can read privilege assignments" on public.admin_privilege_assignments;
create policy "Admins can read privilege assignments" on public.admin_privilege_assignments
for select to authenticated
using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- Only super admins can insert/update/delete privilege assignments
drop policy if exists "Super admins can manage privilege assignments" on public.admin_privilege_assignments;
create policy "Super admins can manage privilege assignments" on public.admin_privilege_assignments
for all to authenticated
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

-- 6) Allow super admins to read all admins and update other admins
drop policy if exists "Super admins can read all admins" on public.admins;
create policy "Super admins can read all admins" on public.admins
for select to authenticated
using (public.is_super_admin(auth.uid()));

drop policy if exists "Super admins can update admins" on public.admins;
create policy "Super admins can update admins" on public.admins
for update to authenticated
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

-- 7) Restrict insert/delete to super admins only (so only super admins can create/remove other admins)
drop policy if exists "Admins can insert admins" on public.admins;
create policy "Super admins can insert admins" on public.admins
for insert to authenticated
with check (public.is_super_admin(auth.uid()));

drop policy if exists "Admins can delete admins" on public.admins;
create policy "Super admins can delete admins" on public.admins
for delete to authenticated
using (public.is_super_admin(auth.uid()));

-- 8) For bootstrap: allow service role to insert first admin (bypass RLS - service role bypasses RLS by default)
-- No change needed - bootstrap will use service role which bypasses RLS.

commit;
