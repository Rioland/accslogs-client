-- Close public access to wallet / order-state functions.
--
-- These SECURITY DEFINER functions move wallet money or change order state and
-- trust their arguments (user id, admin id, request id). Supabase's default
-- privileges let anon and authenticated call them through /rest/v1/rpc, so:
--   * admin_fund_wallet credited any wallet for anyone who knew an admin's
--     user id (the admin id is a parameter, not auth.uid());
--   * text_*_fail_and_refund refunded an order given only its request id;
--   * text_*_debit could debit any user's wallet.
-- Every legitimate caller is a server route using the service-role key
-- (accslogs-client app/api/**, admin_acclogs app/api/wallet-funding), and no
-- RLS policy, trigger or other function references them. Same treatment the
-- bill_payment_* functions got in 20260808020000_security_hardening.sql.
--
-- Applied to production on 2026-10-16.

do $$
declare
  fn regprocedure;
begin
  foreach fn in array array[
    'public.admin_fund_wallet(uuid,uuid,numeric,text)',
    'public.bill_payment_flag_reconciliation(text,text)',
    'public.text_rental_activate(text,text,text,timestamptz,jsonb)',
    'public.text_rental_debit(uuid,text,text,text,boolean,text,boolean,numeric,numeric)',
    'public.text_rental_fail_and_refund(text,text,jsonb)',
    'public.text_rental_record_sms(text,jsonb)',
    'public.text_rental_store_sms(text,text,text,text,text,text,timestamptz)',
    'public.text_verification_activate(text,text,text,timestamptz,jsonb)',
    'public.text_verification_complete(text,text,text,jsonb)',
    'public.text_verification_complete_by_provider(text,text,text,jsonb)',
    'public.text_verification_debit(uuid,text,text,text,numeric,numeric)',
    'public.text_verification_debit_child(uuid,text,bigint,text,text,numeric,numeric)',
    'public.text_verification_fail_and_refund(text,text,jsonb)'
  ]::regprocedure[]
  loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;
end $$;
