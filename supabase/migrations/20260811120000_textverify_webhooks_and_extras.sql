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
