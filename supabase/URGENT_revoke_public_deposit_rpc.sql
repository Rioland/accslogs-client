-- =============================================================================
-- URGENT — run this in the Supabase SQL Editor before anything else.
--
-- public.webhook_process_deposit is SECURITY DEFINER and credits a wallet
-- straight from its arguments, with no authentication of its own. It is
-- currently granted to `anon`, which is the key published in the client's
-- JavaScript bundle (NEXT_PUBLIC_SUPABASE_ANON_KEY).
--
-- Anyone who reads that key can therefore call:
--     POST /rest/v1/rpc/webhook_process_deposit
--     { "p_user_id": "<any user>", "p_amount": 1000000,
--       "p_reference": "x", "p_status": "success" }
-- and credit any balance by any amount.
--
-- The only legitimate caller is app/api/webhook/route.ts, which already uses
-- the service role key, so removing these grants breaks nothing.
-- =============================================================================

revoke execute on function public.webhook_process_deposit(uuid, numeric, text, text, jsonb) from public;
revoke execute on function public.webhook_process_deposit(uuid, numeric, text, text, jsonb) from anon;
revoke execute on function public.webhook_process_deposit(uuid, numeric, text, text, jsonb) from authenticated;

grant execute on function public.webhook_process_deposit(uuid, numeric, text, text, jsonb) to service_role;

-- -----------------------------------------------------------------------------
-- Confirm: expect exactly one row, {service_role}. Any row containing anon or
-- authenticated means the revoke did not take effect.
-- -----------------------------------------------------------------------------
select p.proname,
       coalesce(array_agg(a.grantee::text order by a.grantee::text)
                filter (where a.grantee::text <> 'postgres'), '{}') as granted_to
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  left join lateral aclexplode(p.proacl) x on true
  left join lateral (select x.grantee::regrole as grantee) a on true
 where n.nspname = 'public'
   and p.proname = 'webhook_process_deposit'
 group by p.proname;

-- -----------------------------------------------------------------------------
-- Worth checking afterwards: any deposit that did not come from a real Korapay
-- payment. korapay_data is populated by the genuine webhook path.
-- -----------------------------------------------------------------------------
select id, user_id, amount, reference, status, created_at
  from public.deposits
 where status = 'successful'
   and (korapay_data is null or korapay_data = '{}'::jsonb)
 order by created_at desc
 limit 100;
