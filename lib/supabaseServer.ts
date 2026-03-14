import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client factory for Server Components / Route Handlers.
// Uses public env vars you already configured. If you later add secure server-only
// keys (e.g., SUPABASE_SERVICE_ROLE), you can adapt this file accordingly.

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env: ${name}`);
  }
  return value;
}

const SUPABASE_URL = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
const SUPABASE_ANON_KEY = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

/** Server client with service role - bypasses RLS. Use only in server routes (e.g. webhooks). */
export function getSupabaseAdminClient() {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE?.trim();
  if (!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  return createClient(SUPABASE_URL, key.trim(), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

/** Server client with anon key - RLS applies. Use for RPCs that bypass RLS. */
export function getSupabaseServerClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export default getSupabaseServerClient;
