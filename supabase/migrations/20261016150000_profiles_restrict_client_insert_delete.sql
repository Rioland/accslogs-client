-- Applied to production via the Supabase SQL Editor on 2026-10-16.
--
-- Close a wallet-minting hole on profiles.
--
-- authenticated had table-level INSERT and DELETE on profiles, and the
-- "Allow delete own profile" / "Allow insert own profile" policies only check
-- auth.uid() = id. A signed-in user could therefore delete their own profile
-- and insert a fresh one with any funds balance, someone else's Korapay
-- account_reference (redirecting that person's deposits), or a pre-set
-- email_verified_at.
--
-- The only browser-side write is the signup insert in app/signup/page.tsx,
-- which sends exactly the columns granted below. Admin user creation and
-- deletion run server-side with the service-role key, which is unaffected.
-- UPDATE is already column-limited (first_name, last_name, referral_code)
-- by 20260808020000_security_hardening.sql.

revoke insert, delete on public.profiles from anon, authenticated;
grant insert (id, email, first_name, last_name, referral_code, created_at)
  on public.profiles to authenticated;
