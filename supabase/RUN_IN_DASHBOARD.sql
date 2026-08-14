-- ===========================================================================
-- TextVerified setup — run this entire file in the Supabase SQL Editor.
--
-- Contains 3 migrations in dependency order. Safe to re-run: every statement
-- uses "if not exists" / "or replace" / "drop policy if exists".
--
-- If you later switch to the Supabase CLI, mark these as already applied:
--   supabase migration repair --status applied 20260810160000 20260810170000 20260811120000
-- ===========================================================================


-- ===========================================================================
-- MIGRATION 1 of 3: 20260810160000_text_verifications.sql
-- ===========================================================================

-- TextVerified SMS verifications

create table if not exists public.text_verifications (
  id                   bigserial primary key,
  user_id              uuid not null references public.profiles (id) on delete cascade,
  request_id           text not null unique,
  provider_id          text,
  service_name         text not null,
  capability           text not null default 'sms',
  phone_number         text,
  amount_usd           numeric(12, 4),
  amount_ngn           numeric(12, 2) not null check (amount_ngn > 0),
  status               text not null default 'pending' check (
    status in ('pending', 'active', 'completed', 'cancelled', 'failed', 'refunded', 'expired')
  ),
  sms_code             text,
  sms_content          text,
  provider_response    jsonb,
  error_message        text,
  ends_at              timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists text_verifications_user_id_idx
  on public.text_verifications (user_id, created_at desc);

create index if not exists text_verifications_status_idx
  on public.text_verifications (status);

create index if not exists text_verifications_provider_id_idx
  on public.text_verifications (provider_id);

alter table public.text_verifications enable row level security;

drop policy if exists "Users can read own text verifications" on public.text_verifications;
create policy "Users can read own text verifications"
  on public.text_verifications
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Admins can read all text verifications" on public.text_verifications;
create policy "Admins can read all text verifications"
  on public.text_verifications
  for select
  to authenticated
  using (
    exists (
      select 1 from public.admins a where a.user_id = auth.uid()
    )
  );

drop policy if exists "Admins can update text verifications" on public.text_verifications;
create policy "Admins can update text verifications"
  on public.text_verifications
  for update
  to authenticated
  using (
    exists (
      select 1 from public.admins a where a.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.admins a where a.user_id = auth.uid()
    )
  );

-- Debit wallet + create pending verification row
create or replace function public.text_verification_debit(
  p_user_id      uuid,
  p_request_id   text,
  p_service_name text,
  p_capability   text,
  p_amount_usd   numeric,
  p_amount_ngn   numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_funds numeric;
  v_id    bigint;
begin
  if p_user_id is null then
    return jsonb_build_object('success', false, 'error', 'Missing user');
  end if;

  if p_amount_ngn is null or p_amount_ngn <= 0 then
    return jsonb_build_object('success', false, 'error', 'Invalid amount');
  end if;

  if exists (select 1 from public.text_verifications where request_id = p_request_id) then
    return jsonb_build_object('success', false, 'error', 'Duplicate request_id');
  end if;

  select coalesce(funds, 0) into v_funds
    from public.profiles
   where id = p_user_id
     for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Profile not found');
  end if;

  if v_funds < p_amount_ngn then
    return jsonb_build_object('success', false, 'error', 'Insufficient balance');
  end if;

  update public.profiles
     set funds = funds - p_amount_ngn,
         updated_at = now()
   where id = p_user_id;

  insert into public.text_verifications (
    user_id, request_id, service_name, capability,
    amount_usd, amount_ngn, status
  ) values (
    p_user_id, p_request_id, p_service_name, coalesce(p_capability, 'sms'),
    p_amount_usd, p_amount_ngn, 'pending'
  )
  returning id into v_id;

  return jsonb_build_object(
    'success', true,
    'id', v_id,
    'request_id', p_request_id,
    'new_balance', v_funds - p_amount_ngn
  );
end;
$$;

create or replace function public.text_verification_activate(
  p_request_id        text,
  p_provider_id       text,
  p_phone_number      text,
  p_ends_at           timestamptz,
  p_provider_response jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.text_verifications
     set provider_id = p_provider_id,
         phone_number = p_phone_number,
         ends_at = p_ends_at,
         provider_response = p_provider_response,
         status = 'active',
         updated_at = now()
   where request_id = p_request_id
     and status in ('pending', 'active');

  if not found then
    return jsonb_build_object('success', false, 'error', 'Verification not found');
  end if;

  return jsonb_build_object('success', true);
end;
$$;

create or replace function public.text_verification_complete(
  p_request_id text,
  p_sms_code   text,
  p_sms_content text,
  p_provider_response jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.text_verifications
     set sms_code = p_sms_code,
         sms_content = p_sms_content,
         provider_response = coalesce(p_provider_response, provider_response),
         status = 'completed',
         updated_at = now()
   where request_id = p_request_id
     and status in ('active', 'pending');

  if not found then
    return jsonb_build_object('success', false, 'error', 'Verification not found or already finished');
  end if;

  return jsonb_build_object('success', true);
end;
$$;

create or replace function public.text_verification_fail_and_refund(
  p_request_id    text,
  p_error_message text,
  p_provider_response jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.text_verifications%rowtype;
begin
  select * into v_row
    from public.text_verifications
   where request_id = p_request_id
     for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Verification not found');
  end if;

  if v_row.status in ('refunded', 'completed') then
    return jsonb_build_object('success', false, 'error', 'Already finalized', 'status', v_row.status);
  end if;

  update public.profiles
     set funds = funds + v_row.amount_ngn,
         updated_at = now()
   where id = v_row.user_id;

  update public.text_verifications
     set status = 'refunded',
         error_message = p_error_message,
         provider_response = coalesce(p_provider_response, provider_response),
         updated_at = now()
   where id = v_row.id;

  return jsonb_build_object(
    'success', true,
    'refunded', v_row.amount_ngn
  );
end;
$$;

revoke all on function public.text_verification_debit(uuid, text, text, text, numeric, numeric) from public;
revoke all on function public.text_verification_activate(text, text, text, timestamptz, jsonb) from public;
revoke all on function public.text_verification_complete(text, text, text, jsonb) from public;
revoke all on function public.text_verification_fail_and_refund(text, text, jsonb) from public;

grant execute on function public.text_verification_debit(uuid, text, text, text, numeric, numeric) to service_role;
grant execute on function public.text_verification_activate(text, text, text, timestamptz, jsonb) to service_role;
grant execute on function public.text_verification_complete(text, text, text, jsonb) to service_role;
grant execute on function public.text_verification_fail_and_refund(text, text, jsonb) to service_role;


-- ===========================================================================
-- MIGRATION 2 of 3: 20260810170000_text_rentals.sql
-- ===========================================================================

-- TextVerified phone number rentals (non-renewable + renewable)

create table if not exists public.text_rentals (
  id                   bigserial primary key,
  user_id              uuid not null references public.profiles (id) on delete cascade,
  request_id           text not null unique,
  provider_id          text,
  service_name         text not null,
  capability           text not null default 'sms',
  is_renewable         boolean not null default false,
  duration             text not null,
  always_on            boolean not null default true,
  phone_number         text,
  amount_usd           numeric(12, 4),
  amount_ngn           numeric(12, 2) not null check (amount_ngn > 0),
  status               text not null default 'pending' check (
    status in ('pending', 'active', 'expired', 'refunded', 'failed', 'cancelled')
  ),
  provider_response    jsonb,
  error_message        text,
  ends_at              timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists text_rentals_user_id_idx
  on public.text_rentals (user_id, created_at desc);

create index if not exists text_rentals_status_idx
  on public.text_rentals (status);

create index if not exists text_rentals_provider_id_idx
  on public.text_rentals (provider_id);

alter table public.text_rentals enable row level security;

drop policy if exists "Users can read own text rentals" on public.text_rentals;
create policy "Users can read own text rentals"
  on public.text_rentals
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Admins can read all text rentals" on public.text_rentals;
create policy "Admins can read all text rentals"
  on public.text_rentals
  for select
  to authenticated
  using (
    exists (
      select 1 from public.admins a where a.user_id = auth.uid()
    )
  );

drop policy if exists "Admins can update text rentals" on public.text_rentals;
create policy "Admins can update text rentals"
  on public.text_rentals
  for update
  to authenticated
  using (
    exists (
      select 1 from public.admins a where a.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.admins a where a.user_id = auth.uid()
    )
  );

create or replace function public.text_rental_debit(
  p_user_id      uuid,
  p_request_id   text,
  p_service_name text,
  p_capability   text,
  p_is_renewable boolean,
  p_duration     text,
  p_always_on    boolean,
  p_amount_usd   numeric,
  p_amount_ngn   numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_funds numeric;
  v_id    bigint;
begin
  if p_user_id is null then
    return jsonb_build_object('success', false, 'error', 'Missing user');
  end if;

  if p_amount_ngn is null or p_amount_ngn <= 0 then
    return jsonb_build_object('success', false, 'error', 'Invalid amount');
  end if;

  if exists (select 1 from public.text_rentals where request_id = p_request_id) then
    return jsonb_build_object('success', false, 'error', 'Duplicate request_id');
  end if;

  select coalesce(funds, 0) into v_funds
    from public.profiles
   where id = p_user_id
     for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Profile not found');
  end if;

  if v_funds < p_amount_ngn then
    return jsonb_build_object('success', false, 'error', 'Insufficient balance');
  end if;

  update public.profiles
     set funds = funds - p_amount_ngn,
         updated_at = now()
   where id = p_user_id;

  insert into public.text_rentals (
    user_id, request_id, service_name, capability,
    is_renewable, duration, always_on, amount_usd, amount_ngn, status
  ) values (
    p_user_id, p_request_id, p_service_name, coalesce(p_capability, 'sms'),
    coalesce(p_is_renewable, false), p_duration, coalesce(p_always_on, true),
    p_amount_usd, p_amount_ngn, 'pending'
  )
  returning id into v_id;

  return jsonb_build_object(
    'success', true,
    'id', v_id,
    'request_id', p_request_id,
    'new_balance', v_funds - p_amount_ngn
  );
end;
$$;

create or replace function public.text_rental_activate(
  p_request_id        text,
  p_provider_id       text,
  p_phone_number      text,
  p_ends_at           timestamptz,
  p_provider_response jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.text_rentals
     set provider_id = p_provider_id,
         phone_number = p_phone_number,
         ends_at = p_ends_at,
         provider_response = p_provider_response,
         status = 'active',
         updated_at = now()
   where request_id = p_request_id
     and status in ('pending', 'active');

  if not found then
    return jsonb_build_object('success', false, 'error', 'Rental not found');
  end if;

  return jsonb_build_object('success', true);
end;
$$;

create or replace function public.text_rental_fail_and_refund(
  p_request_id    text,
  p_error_message text,
  p_provider_response jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.text_rentals%rowtype;
begin
  select * into v_row
    from public.text_rentals
   where request_id = p_request_id
     for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Rental not found');
  end if;

  if v_row.status in ('refunded') then
    return jsonb_build_object('success', false, 'error', 'Already refunded', 'status', v_row.status);
  end if;

  if v_row.status = 'expired' then
    return jsonb_build_object('success', false, 'error', 'Already expired');
  end if;

  update public.profiles
     set funds = funds + v_row.amount_ngn,
         updated_at = now()
   where id = v_row.user_id;

  update public.text_rentals
     set status = 'refunded',
         error_message = p_error_message,
         provider_response = coalesce(p_provider_response, provider_response),
         updated_at = now()
   where id = v_row.id;

  return jsonb_build_object(
    'success', true,
    'refunded', v_row.amount_ngn
  );
end;
$$;

revoke all on function public.text_rental_debit(uuid, text, text, text, boolean, text, boolean, numeric, numeric) from public;
revoke all on function public.text_rental_activate(text, text, text, timestamptz, jsonb) from public;
revoke all on function public.text_rental_fail_and_refund(text, text, jsonb) from public;

grant execute on function public.text_rental_debit(uuid, text, text, text, boolean, text, boolean, numeric, numeric) to service_role;
grant execute on function public.text_rental_activate(text, text, text, timestamptz, jsonb) to service_role;
grant execute on function public.text_rental_fail_and_refund(text, text, jsonb) to service_role;


-- ===========================================================================
-- MIGRATION 3 of 3: 20260811120000_textverify_webhooks_and_extras.sql
-- ===========================================================================

-- TextVerified: webhook delivery, voice capability, area codes, recovery flows.
-- Depends on 20260810160000_text_verifications.sql and 20260810170000_text_rentals.sql.

-- ---------------------------------------------------------------------------
-- Columns
-- ---------------------------------------------------------------------------

alter table public.text_verifications
  add column if not exists area_code   text,
  -- set when this verification came from reuse/reactivate of an earlier one
  add column if not exists parent_id   bigint references public.text_verifications (id) on delete set null,
  add column if not exists reported_at timestamptz;

alter table public.text_rentals
  add column if not exists area_code text;

-- ---------------------------------------------------------------------------
-- Webhook idempotency
--
-- TextVerified retries webhooks with exponential backoff, so the same event can
-- arrive many times. The idempotency key is the primary key: a duplicate insert
-- fails the uniqueness check and the handler can safely skip re-processing.
-- ---------------------------------------------------------------------------

create table if not exists public.text_webhook_events (
  idempotency_key text primary key,
  event           text not null,
  reservation_id  text,
  payload         jsonb,
  received_at     timestamptz not null default now()
);

create index if not exists text_webhook_events_received_at_idx
  on public.text_webhook_events (received_at desc);

create index if not exists text_webhook_events_reservation_idx
  on public.text_webhook_events (reservation_id);

alter table public.text_webhook_events enable row level security;
-- No policies: service role only. Webhook payloads are never read by clients.

-- ---------------------------------------------------------------------------
-- Complete a verification from a webhook.
--
-- Webhooks identify the line by provider reservation id, not by our request_id,
-- so this is keyed differently from text_verification_complete.
-- ---------------------------------------------------------------------------

create or replace function public.text_verification_complete_by_provider(
  p_provider_id       text,
  p_sms_code          text,
  p_sms_content       text,
  p_provider_response jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.text_verifications%rowtype;
begin
  select * into v_row
    from public.text_verifications
   where provider_id = p_provider_id
   order by created_at desc
   limit 1
     for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Verification not found');
  end if;

  -- Already finalised: treat as success so webhook retries stop.
  if v_row.status in ('completed', 'refunded') then
    return jsonb_build_object('success', true, 'id', v_row.id, 'status', v_row.status, 'noop', true);
  end if;

  update public.text_verifications
     set sms_code = coalesce(p_sms_code, sms_code),
         sms_content = coalesce(p_sms_content, sms_content),
         provider_response = coalesce(p_provider_response, provider_response),
         status = 'completed',
         updated_at = now()
   where id = v_row.id;

  return jsonb_build_object('success', true, 'id', v_row.id, 'status', 'completed');
end;
$$;

-- ---------------------------------------------------------------------------
-- Record an SMS against a rental (rentals stay active and receive many).
-- ---------------------------------------------------------------------------

create or replace function public.text_rental_record_sms(
  p_provider_id       text,
  p_provider_response jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.text_rentals%rowtype;
begin
  select * into v_row
    from public.text_rentals
   where provider_id = p_provider_id
   order by created_at desc
   limit 1
     for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Rental not found');
  end if;

  update public.text_rentals
     set provider_response = coalesce(p_provider_response, provider_response),
         updated_at = now()
   where id = v_row.id;

  return jsonb_build_object('success', true, 'id', v_row.id);
end;
$$;

-- ---------------------------------------------------------------------------
-- Debit for a verification that continues an existing one (reuse/reactivate).
-- Same guarantees as text_verification_debit, plus the parent link.
-- ---------------------------------------------------------------------------

create or replace function public.text_verification_debit_child(
  p_user_id      uuid,
  p_request_id   text,
  p_parent_id    bigint,
  p_service_name text,
  p_capability   text,
  p_amount_usd   numeric,
  p_amount_ngn   numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_funds numeric;
  v_id    bigint;
begin
  if p_user_id is null then
    return jsonb_build_object('success', false, 'error', 'Missing user');
  end if;

  if p_amount_ngn is null or p_amount_ngn < 0 then
    return jsonb_build_object('success', false, 'error', 'Invalid amount');
  end if;

  if exists (select 1 from public.text_verifications where request_id = p_request_id) then
    return jsonb_build_object('success', false, 'error', 'Duplicate request_id');
  end if;

  -- The parent must belong to the caller, otherwise a user could reuse
  -- someone else's number by guessing an id.
  if not exists (
    select 1 from public.text_verifications
     where id = p_parent_id and user_id = p_user_id
  ) then
    return jsonb_build_object('success', false, 'error', 'Parent verification not found');
  end if;

  select coalesce(funds, 0) into v_funds
    from public.profiles
   where id = p_user_id
     for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Profile not found');
  end if;

  if v_funds < p_amount_ngn then
    return jsonb_build_object('success', false, 'error', 'Insufficient balance');
  end if;

  if p_amount_ngn > 0 then
    update public.profiles
       set funds = funds - p_amount_ngn,
           updated_at = now()
     where id = p_user_id;
  end if;

  insert into public.text_verifications (
    user_id, request_id, parent_id, service_name, capability,
    amount_usd, amount_ngn, status
  ) values (
    p_user_id, p_request_id, p_parent_id, p_service_name, coalesce(p_capability, 'sms'),
    p_amount_usd, greatest(p_amount_ngn, 0.01), 'pending'
  )
  returning id into v_id;

  return jsonb_build_object(
    'success', true,
    'id', v_id,
    'request_id', p_request_id,
    'new_balance', v_funds - p_amount_ngn
  );
end;
$$;

revoke all on function public.text_verification_complete_by_provider(text, text, text, jsonb) from public;
revoke all on function public.text_rental_record_sms(text, jsonb) from public;
revoke all on function public.text_verification_debit_child(uuid, text, bigint, text, text, numeric, numeric) from public;

grant execute on function public.text_verification_complete_by_provider(text, text, text, jsonb) to service_role;
grant execute on function public.text_rental_record_sms(text, jsonb) to service_role;
grant execute on function public.text_verification_debit_child(uuid, text, bigint, text, text, numeric, numeric) to service_role;


-- ===========================================================================
-- Verification — all three rows should come back.
-- ===========================================================================

select table_name
  from information_schema.tables
 where table_schema = 'public'
   and table_name in ('text_verifications', 'text_rentals', 'text_webhook_events')
 order by table_name;

select routine_name
  from information_schema.routines
 where routine_schema = 'public'
   and routine_name like 'text_%'
 order by routine_name;
