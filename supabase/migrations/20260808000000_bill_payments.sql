-- Bill payments (eBills Africa): airtime, data, electricity, cable TV

create table if not exists public.bill_payments (
  id                bigserial primary key,
  user_id           uuid not null references public.profiles (id) on delete cascade,
  request_id        text not null unique,
  product_type      text not null check (
    product_type in ('airtime', 'data', 'electricity', 'tv', 'betting', 'epins')
  ),
  service_id        text not null,
  customer_id       text,
  variation_id      text,
  amount            numeric(12, 2) not null check (amount > 0),
  amount_charged    numeric(12, 2),
  discount          numeric(12, 2),
  status            text not null default 'pending' check (
    status in ('pending', 'processing', 'completed', 'failed', 'refunded')
  ),
  provider_order_id text,
  provider_token    text,
  provider_units    text,
  provider_response jsonb,
  error_message     text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists bill_payments_user_id_idx
  on public.bill_payments (user_id, created_at desc);

create index if not exists bill_payments_status_idx
  on public.bill_payments (status);

alter table public.bill_payments enable row level security;

drop policy if exists "Users can read own bill payments" on public.bill_payments;
create policy "Users can read own bill payments"
  on public.bill_payments
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Admins can read all bill payments" on public.bill_payments;
create policy "Admins can read all bill payments"
  on public.bill_payments
  for select
  to authenticated
  using (
    exists (
      select 1 from public.admins a where a.user_id = auth.uid()
    )
  );

drop policy if exists "Admins can update bill payments" on public.bill_payments;
create policy "Admins can update bill payments"
  on public.bill_payments
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

-- Debit wallet + create pending bill payment (service role / API only)
create or replace function public.bill_payment_debit(
  p_user_id      uuid,
  p_request_id   text,
  p_product_type text,
  p_service_id   text,
  p_customer_id  text,
  p_variation_id text,
  p_amount       numeric
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

  if p_amount is null or p_amount <= 0 then
    return jsonb_build_object('success', false, 'error', 'Invalid amount');
  end if;

  if exists (select 1 from public.bill_payments where request_id = p_request_id) then
    return jsonb_build_object('success', false, 'error', 'Duplicate request_id');
  end if;

  select funds into v_funds
    from public.profiles
   where id = p_user_id
     for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Profile not found');
  end if;

  if v_funds < p_amount then
    return jsonb_build_object('success', false, 'error', 'Insufficient balance');
  end if;

  update public.profiles
     set funds = funds - p_amount,
         updated_at = now()
   where id = p_user_id;

  insert into public.bill_payments (
    user_id, request_id, product_type, service_id,
    customer_id, variation_id, amount, status
  ) values (
    p_user_id, p_request_id, p_product_type, p_service_id,
    p_customer_id, p_variation_id, p_amount, 'processing'
  )
  returning id into v_id;

  return jsonb_build_object(
    'success', true,
    'id', v_id,
    'request_id', p_request_id,
    'new_balance', v_funds - p_amount
  );
end;
$$;

-- Mark bill payment completed after provider success
create or replace function public.bill_payment_complete(
  p_request_id        text,
  p_provider_order_id text,
  p_amount_charged    numeric,
  p_discount          numeric,
  p_provider_token    text,
  p_provider_units    text,
  p_provider_response jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.bill_payments%rowtype;
begin
  select * into v_row
    from public.bill_payments
   where request_id = p_request_id
     for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Payment not found');
  end if;

  if v_row.status = 'completed' then
    return jsonb_build_object('success', true, 'id', v_row.id, 'status', 'completed');
  end if;

  if v_row.status not in ('processing', 'pending') then
    return jsonb_build_object('success', false, 'error', 'Invalid status: ' || v_row.status);
  end if;

  update public.bill_payments
     set status = 'completed',
         provider_order_id = coalesce(p_provider_order_id, provider_order_id),
         amount_charged = coalesce(p_amount_charged, amount_charged),
         discount = coalesce(p_discount, discount),
         provider_token = coalesce(p_provider_token, provider_token),
         provider_units = coalesce(p_provider_units, provider_units),
         provider_response = coalesce(p_provider_response, provider_response),
         updated_at = now()
   where id = v_row.id;

  return jsonb_build_object('success', true, 'id', v_row.id, 'status', 'completed');
end;
$$;

-- Fail + refund wallet
create or replace function public.bill_payment_fail_and_refund(
  p_request_id        text,
  p_error_message     text,
  p_provider_response jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.bill_payments%rowtype;
begin
  select * into v_row
    from public.bill_payments
   where request_id = p_request_id
     for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Payment not found');
  end if;

  if v_row.status in ('refunded', 'failed') then
    return jsonb_build_object('success', true, 'id', v_row.id, 'status', v_row.status);
  end if;

  if v_row.status = 'completed' then
    return jsonb_build_object('success', false, 'error', 'Already completed');
  end if;

  update public.profiles
     set funds = funds + v_row.amount,
         updated_at = now()
   where id = v_row.user_id;

  update public.bill_payments
     set status = 'refunded',
         error_message = left(coalesce(p_error_message, 'Provider failed'), 500),
         provider_response = coalesce(p_provider_response, provider_response),
         updated_at = now()
   where id = v_row.id;

  return jsonb_build_object(
    'success', true,
    'id', v_row.id,
    'status', 'refunded',
    'refunded_amount', v_row.amount
  );
end;
$$;

revoke all on function public.bill_payment_debit(uuid, text, text, text, text, text, numeric) from public;
revoke all on function public.bill_payment_complete(text, text, numeric, numeric, text, text, jsonb) from public;
revoke all on function public.bill_payment_fail_and_refund(text, text, jsonb) from public;

grant execute on function public.bill_payment_debit(uuid, text, text, text, text, text, numeric) to service_role;
grant execute on function public.bill_payment_complete(text, text, numeric, numeric, text, text, jsonb) to service_role;
grant execute on function public.bill_payment_fail_and_refund(text, text, jsonb) to service_role;
