-- ===========================================================================
-- eBills webhook support — run this in the Supabase SQL Editor.
-- Safe to re-run (if not exists / or replace).
-- ===========================================================================

-- eBills webhook notifications for bill_payments.
-- Depends on 20260808000000_bill_payments.sql.

-- ---------------------------------------------------------------------------
-- Reconciliation flag.
--
-- If the request to eBills times out after the order was actually placed, the
-- pay route refunds the customer. A later "completed-api" webhook then tells us
-- the service WAS delivered — money already returned, goods already given.
-- That cannot be auto-corrected (the customer may have spent the refund), so it
-- is flagged for a human instead of being silently swallowed.
-- ---------------------------------------------------------------------------

alter table public.bill_payments
  add column if not exists needs_reconciliation boolean not null default false,
  add column if not exists reconciliation_note  text;

create index if not exists bill_payments_reconciliation_idx
  on public.bill_payments (needs_reconciliation)
  where needs_reconciliation;

-- ---------------------------------------------------------------------------
-- Webhook audit + idempotency.
--
-- eBills sends no idempotency key, so the natural key is the order plus the
-- status being reported: one order may legitimately report completed and later
-- refunded, but never the same transition twice.
-- ---------------------------------------------------------------------------

create table if not exists public.bill_webhook_events (
  event_key    text primary key,
  order_id     text,
  request_id   text,
  status       text not null,
  payload      jsonb,
  received_at  timestamptz not null default now()
);

create index if not exists bill_webhook_events_request_id_idx
  on public.bill_webhook_events (request_id);

create index if not exists bill_webhook_events_received_at_idx
  on public.bill_webhook_events (received_at desc);

alter table public.bill_webhook_events enable row level security;
-- No policies: service role only.

-- ---------------------------------------------------------------------------
-- Flag a payment for manual reconciliation.
-- ---------------------------------------------------------------------------

create or replace function public.bill_payment_flag_reconciliation(
  p_request_id text,
  p_note       text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id bigint;
begin
  update public.bill_payments
     set needs_reconciliation = true,
         reconciliation_note = left(coalesce(p_note, ''), 500),
         updated_at = now()
   where request_id = p_request_id
  returning id into v_id;

  if v_id is null then
    return jsonb_build_object('success', false, 'error', 'Payment not found');
  end if;

  return jsonb_build_object('success', true, 'id', v_id);
end;
$$;

revoke all on function public.bill_payment_flag_reconciliation(text, text) from public;
grant execute on function public.bill_payment_flag_reconciliation(text, text) to service_role;

-- ===========================================================================
-- Verify
-- ===========================================================================

select table_name from information_schema.tables
 where table_schema = 'public' and table_name = 'bill_webhook_events';

select column_name from information_schema.columns
 where table_schema = 'public' and table_name = 'bill_payments'
   and column_name in ('needs_reconciliation', 'reconciliation_note')
 order by column_name;
