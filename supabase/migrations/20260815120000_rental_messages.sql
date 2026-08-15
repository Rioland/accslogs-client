-- Inbox for rented numbers.
--
-- A rental is held for days to a year and is deliberately reused across many
-- services, so it collects many messages. Previously only the newest code was
-- kept on the rental row, which meant a second OTP overwrote the first and no
-- history survived. Messages are now rows.
--
-- Depends on 20260810170000_text_rentals.sql.

create table if not exists public.text_rental_messages (
  id               bigserial primary key,
  rental_id        bigint not null references public.text_rentals (id) on delete cascade,
  user_id          uuid   not null references public.profiles (id) on delete cascade,
  -- Present when we learned about the message by polling; webhook payloads
  -- carry no message id, hence the content-based uniqueness below.
  provider_sms_id  text,
  from_number      text,
  to_number        text,
  sms_content      text,
  parsed_code      text,
  received_at      timestamptz not null,
  created_at       timestamptz not null default now()
);

-- The same message can arrive twice: once by webhook, once by the polling
-- fallback. Only one carries a provider id, so identity is the rental plus the
-- content plus the instant it was sent.
create unique index if not exists text_rental_messages_natural_key
  on public.text_rental_messages (
    rental_id,
    md5(coalesce(sms_content, '')),
    received_at
  );

create index if not exists text_rental_messages_rental_idx
  on public.text_rental_messages (rental_id, received_at desc);

create index if not exists text_rental_messages_user_idx
  on public.text_rental_messages (user_id, received_at desc);

alter table public.text_rental_messages enable row level security;

drop policy if exists "Users can read own rental messages" on public.text_rental_messages;
create policy "Users can read own rental messages"
  on public.text_rental_messages
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Admins can read all rental messages" on public.text_rental_messages;
create policy "Admins can read all rental messages"
  on public.text_rental_messages
  for select
  to authenticated
  using (
    exists (select 1 from public.admins a where a.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- Store one message against a rental, addressed by provider reservation id.
-- Safe to call repeatedly: a duplicate is reported, not raised.
-- ---------------------------------------------------------------------------

create or replace function public.text_rental_store_sms(
  p_provider_id    text,
  p_sms_id         text,
  p_from           text,
  p_to             text,
  p_content        text,
  p_parsed_code    text,
  p_received_at    timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rental public.text_rentals%rowtype;
  v_id     bigint;
begin
  select * into v_rental
    from public.text_rentals
   where provider_id = p_provider_id
   order by created_at desc
   limit 1;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Rental not found');
  end if;

  insert into public.text_rental_messages (
    rental_id, user_id, provider_sms_id, from_number, to_number,
    sms_content, parsed_code, received_at
  ) values (
    v_rental.id, v_rental.user_id, p_sms_id, p_from, p_to,
    p_content, p_parsed_code, coalesce(p_received_at, now())
  )
  on conflict do nothing
  returning id into v_id;

  update public.text_rentals
     set updated_at = now()
   where id = v_rental.id;

  if v_id is null then
    return jsonb_build_object(
      'success', true, 'duplicate', true, 'rental_id', v_rental.id
    );
  end if;

  return jsonb_build_object(
    'success', true, 'id', v_id, 'rental_id', v_rental.id
  );
end;
$$;

revoke all on function public.text_rental_store_sms(text, text, text, text, text, text, timestamptz) from public;
grant execute on function public.text_rental_store_sms(text, text, text, text, text, text, timestamptz) to service_role;
