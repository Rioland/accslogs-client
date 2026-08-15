-- ===========================================================================
-- Admin CRUD permissions + wallet funding — run in the Supabase SQL Editor.
--
-- Safe to re-run (if not exists / or replace / on conflict).
-- Requires database_admin_privileges.sql to have been run already (it creates
-- public.admins.is_super_admin and public.is_super_admin()).
-- ===========================================================================

-- Admin CRUD permissions + admin-initiated wallet funding.
--
-- Until now any row in public.admins granted unrestricted access. This adds a
-- per-resource, per-action model, plus an audited way for staff to credit a
-- customer's wallet (refunds, goodwill, failed top-ups).

-- ---------------------------------------------------------------------------
-- 1) Permission model
-- ---------------------------------------------------------------------------

create table if not exists public.admin_permissions (
  admin_user_id uuid not null references auth.users (id) on delete cascade,
  resource      text not null,
  action        text not null check (action in ('create', 'read', 'update', 'delete')),
  granted_by    uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  primary key (admin_user_id, resource, action)
);

comment on table public.admin_permissions is
  'Per-resource CRUD grants. Ignored for super admins, who bypass all checks.';

create index if not exists admin_permissions_user_idx
  on public.admin_permissions (admin_user_id);

alter table public.admin_permissions enable row level security;

drop policy if exists "Admins can read own permissions" on public.admin_permissions;
create policy "Admins can read own permissions"
  on public.admin_permissions
  for select
  to authenticated
  using (admin_user_id = auth.uid() or public.is_super_admin(auth.uid()));

-- The catalogue of resources the admin UI knows about. Kept as data so the
-- permission screen can render without hardcoding a list in two codebases.
create table if not exists public.admin_resources (
  slug        text primary key,
  name        text not null,
  description text,
  sort_order  smallint not null default 100
);

insert into public.admin_resources (slug, name, description, sort_order) values
  ('users',              'Users',              'Customer accounts and profiles', 10),
  ('wallet_funding',     'Wallet Funding',     'Credit or debit customer wallets', 20),
  ('deposits',           'Deposits',           'Customer deposits and top-ups', 30),
  ('transactions',       'Transactions',       'Marketplace orders', 40),
  ('bill_payments',      'Bill Payments',      'Airtime, data, electricity, TV, betting, ePINs', 50),
  ('text_verifications', 'SMS Verifications',  'One-time number orders', 60),
  ('text_rentals',       'SMS Rentals',        'Rented number orders', 70),
  ('categories',         'Categories',         'Product categories and subcategories', 80),
  ('sell_accounts',      'Sell Accounts',      'Seller submissions and approvals', 90),
  ('tickets',            'Support Tickets',    'Customer support conversations', 100),
  ('admins',             'Admin Management',   'Create admins and assign permissions', 110),
  ('settings',           'Settings',           'System configuration', 120)
on conflict (slug) do update
  set name = excluded.name,
      description = excluded.description,
      sort_order = excluded.sort_order;

alter table public.admin_resources enable row level security;

drop policy if exists "Admins can read resources" on public.admin_resources;
create policy "Admins can read resources"
  on public.admin_resources
  for select
  to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- 2) Permission check
-- ---------------------------------------------------------------------------

create or replace function public.admin_has_permission(
  p_resource text,
  p_action   text,
  p_uid      uuid default auth.uid()
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    -- Must be an admin at all.
    exists (select 1 from public.admins a where a.user_id = p_uid)
    and (
      -- Super admins bypass the grant table entirely.
      coalesce((select a.is_super_admin from public.admins a where a.user_id = p_uid), false)
      or exists (
        select 1 from public.admin_permissions p
         where p.admin_user_id = p_uid
           and p.resource = p_resource
           and p.action = p_action
      )
    );
$$;

/** Everything the UI needs to decide what to render, in one round trip. */
create or replace function public.admin_my_permissions()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin  boolean;
  v_is_super  boolean;
  v_perms     jsonb;
begin
  select true, coalesce(a.is_super_admin, false)
    into v_is_admin, v_is_super
    from public.admins a
   where a.user_id = auth.uid();

  if not coalesce(v_is_admin, false) then
    return jsonb_build_object('is_admin', false, 'is_super_admin', false, 'permissions', '{}'::jsonb);
  end if;

  if v_is_super then
    -- Grant every action on every known resource rather than a magic flag, so
    -- the UI has one shape to reason about.
    select jsonb_object_agg(r.slug, jsonb_build_array('create', 'read', 'update', 'delete'))
      into v_perms
      from public.admin_resources r;
  else
    select coalesce(jsonb_object_agg(t.resource, t.actions), '{}'::jsonb)
      into v_perms
      from (
        select p.resource, jsonb_agg(p.action order by p.action) as actions
          from public.admin_permissions p
         where p.admin_user_id = auth.uid()
         group by p.resource
      ) t;
  end if;

  return jsonb_build_object(
    'is_admin', true,
    'is_super_admin', v_is_super,
    'permissions', coalesce(v_perms, '{}'::jsonb)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 3) Admin-initiated wallet funding
-- ---------------------------------------------------------------------------

create table if not exists public.admin_wallet_fundings (
  id             bigserial primary key,
  user_id        uuid not null references public.profiles (id) on delete cascade,
  admin_user_id  uuid not null references auth.users (id) on delete set null,
  -- Positive credits the wallet, negative debits it. Never zero.
  amount         numeric(12, 2) not null check (amount <> 0),
  balance_before numeric(12, 2) not null,
  balance_after  numeric(12, 2) not null,
  reason         text not null,
  created_at     timestamptz not null default now()
);

comment on table public.admin_wallet_fundings is
  'Audit trail of manual wallet adjustments. Every credit or debit is recorded with who did it and why.';

create index if not exists admin_wallet_fundings_user_idx
  on public.admin_wallet_fundings (user_id, created_at desc);

create index if not exists admin_wallet_fundings_admin_idx
  on public.admin_wallet_fundings (admin_user_id, created_at desc);

alter table public.admin_wallet_fundings enable row level security;

drop policy if exists "Users can read own adjustments" on public.admin_wallet_fundings;
create policy "Users can read own adjustments"
  on public.admin_wallet_fundings
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Admins can read all adjustments" on public.admin_wallet_fundings;
create policy "Admins can read all adjustments"
  on public.admin_wallet_fundings
  for select
  to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

/**
 * Adjust a wallet and record why.
 *
 * The row lock and the balance_before/after snapshot make each adjustment
 * self-describing and safe against two admins acting at once. A debit is
 * refused if it would push the balance negative, so a typo cannot leave a
 * customer owing money.
 */
create or replace function public.admin_fund_wallet(
  p_admin_user_id uuid,
  p_user_id       uuid,
  p_amount        numeric,
  p_reason        text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before numeric;
  v_after  numeric;
  v_id     bigint;
begin
  if p_amount is null or p_amount = 0 then
    return jsonb_build_object('success', false, 'error', 'Amount must not be zero');
  end if;

  if coalesce(btrim(p_reason), '') = '' then
    return jsonb_build_object('success', false, 'error', 'A reason is required');
  end if;

  if not public.admin_has_permission('wallet_funding', 'create', p_admin_user_id) then
    return jsonb_build_object('success', false, 'error', 'Not permitted to fund wallets');
  end if;

  select coalesce(funds, 0) into v_before
    from public.profiles
   where id = p_user_id
     for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'User not found');
  end if;

  v_after := v_before + p_amount;

  if v_after < 0 then
    return jsonb_build_object(
      'success', false,
      'error', 'That debit would put the balance below zero',
      'balance', v_before
    );
  end if;

  update public.profiles
     set funds = v_after,
         updated_at = now()
   where id = p_user_id;

  insert into public.admin_wallet_fundings (
    user_id, admin_user_id, amount, balance_before, balance_after, reason
  ) values (
    p_user_id, p_admin_user_id, p_amount, v_before, v_after, btrim(p_reason)
  )
  returning id into v_id;

  return jsonb_build_object(
    'success', true,
    'id', v_id,
    'balance_before', v_before,
    'balance_after', v_after
  );
end;
$$;

revoke all on function public.admin_fund_wallet(uuid, uuid, numeric, text) from public;
grant execute on function public.admin_fund_wallet(uuid, uuid, numeric, text) to service_role;

revoke all on function public.admin_has_permission(text, text, uuid) from public;
grant execute on function public.admin_has_permission(text, text, uuid) to authenticated, service_role;
grant execute on function public.admin_my_permissions() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4) Seed: promote the super admin, keep existing admins working
--
-- Enforcement is being added to a system that had none, so every current admin
-- is granted full CRUD to preserve today's behaviour. Tighten individuals
-- afterwards from the admin screen — this migration must not lock anyone out.
-- ---------------------------------------------------------------------------

do $$
declare
  v_super uuid;
begin
  select id into v_super from auth.users where lower(email) = 'accslogs01@gmail.com' limit 1;

  if v_super is not null then
    insert into public.admins (user_id, is_super_admin, is_primary)
    values (v_super, true, true)
    on conflict (user_id) do update
      set is_super_admin = true,
          is_primary = true;
  else
    raise notice 'accslogs01@gmail.com has no auth user yet — sign that account up, then re-run this block.';
  end if;

  insert into public.admin_permissions (admin_user_id, resource, action)
  select a.user_id, r.slug, x.action
    from public.admins a
   cross join public.admin_resources r
   cross join (values ('create'), ('read'), ('update'), ('delete')) as x(action)
   where coalesce(a.is_super_admin, false) = false
  on conflict do nothing;
end $$;

-- ===========================================================================
-- Verify
-- ===========================================================================

-- Tables that should now exist
select table_name from information_schema.tables
 where table_schema = 'public'
   and table_name in ('admin_permissions', 'admin_resources', 'admin_wallet_fundings')
 order by table_name;

-- Who is the super admin?
select p.email, a.is_super_admin, a.is_primary
  from public.admins a
  join public.profiles p on p.id = a.user_id
 order by a.is_super_admin desc, p.email;

-- Grants per admin (super admins intentionally have none: they bypass)
select p.email, count(ap.*) as grants
  from public.admins a
  join public.profiles p on p.id = a.user_id
  left join public.admin_permissions ap on ap.admin_user_id = a.user_id
 group by p.email
 order by p.email;
