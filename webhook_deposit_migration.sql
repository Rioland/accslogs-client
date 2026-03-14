-- Webhook deposit RPC: allows inserting deposits and updating profile funds
-- using the anon key. Call this from your webhook when service role key is not available.
-- Run in Supabase SQL editor.

create or replace function public.webhook_process_deposit(
  p_user_id uuid,
  p_amount numeric,
  p_reference text,
  p_status text,
  p_korapay_data jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deposit_status text;
  v_current_funds numeric;
begin
  -- Normalize status
  v_deposit_status := case when p_status = 'success' then 'successful' else coalesce(p_status, 'pending') end;
  if v_deposit_status not in ('pending', 'successful', 'failed') then
    v_deposit_status := 'pending';
  end if;

  -- Insert deposit (bypasses RLS due to security definer)
  insert into public.deposits (user_id, amount, reference, status, korapay_data)
  values (p_user_id, p_amount, p_reference, v_deposit_status, p_korapay_data);

  -- Update profile balance only for successful payments
  if v_deposit_status = 'successful' then
    update public.profiles
       set funds = coalesce(funds, 0) + p_amount,
           updated_at = now()
     where id = p_user_id;
  end if;

  return jsonb_build_object('success', true, 'status', v_deposit_status);
exception
  when unique_violation then
    return jsonb_build_object('success', true, 'message', 'Already processed');
  when others then
    return jsonb_build_object('success', false, 'error', sqlerrm);
end;
$$;

-- Allow anon and authenticated to execute (webhook has no auth)
grant execute on function public.webhook_process_deposit(uuid, numeric, text, text, jsonb) to anon;
grant execute on function public.webhook_process_deposit(uuid, numeric, text, text, jsonb) to authenticated;
grant execute on function public.webhook_process_deposit(uuid, numeric, text, text, jsonb) to service_role;
-- Add korapay_data column to deposits table
ALTER TABLE public.deposits
ADD COLUMN IF NOT EXISTS korapay_data jsonb;