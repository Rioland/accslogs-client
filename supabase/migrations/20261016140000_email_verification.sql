-- App-level email verification.
--
-- Supabase's own "Confirm email" setting is off for this project, so every
-- auth user is marked confirmed the moment they sign up and Supabase never
-- sends a confirmation email. Verification is therefore tracked here and the
-- link is sent through our own SMTP (lib/mailer.ts). Unverified users can
-- still use the dashboard; they see a banner asking them to verify.
--
-- Only server routes (service-role key) write either of these.

alter table public.profiles
  add column if not exists email_verified_at timestamptz;

-- profiles uses column-level UPDATE grants (first_name, last_name,
-- referral_code), so authenticated users cannot set email_verified_at
-- themselves. Nothing to grant here.

create table if not exists public.email_verification_tokens (
  id          bigserial primary key,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  -- Address the link was sent to; must still match the account when used.
  email       text not null,
  -- sha256 of the token in the link. The raw token is never stored.
  token_hash  text not null unique,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists email_verification_tokens_user_idx
  on public.email_verification_tokens (user_id, created_at desc);

-- RLS on with no policies: invisible to anon and authenticated.
alter table public.email_verification_tokens enable row level security;
revoke all on public.email_verification_tokens from anon, authenticated;
revoke all on sequence public.email_verification_tokens_id_seq from anon, authenticated;
