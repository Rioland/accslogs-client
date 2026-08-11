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
