import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client factory. Uses lazy init so env vars are read at
// request time (not module load), which is more reliable in API routes/server.

function getEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

/** Server client with service role - bypasses RLS. Use only in server routes (e.g. webhooks). */
export function getSupabaseAdminClient() {
  const url = getEnv('NEXT_PUBLIC_SUPABASE_URL');
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE?.trim();
  if (!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key.trim(), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

/** Server client with anon key - RLS applies. Use for RPCs that bypass RLS. */
export function getSupabaseServerClient() {
  const url = getEnv('NEXT_PUBLIC_SUPABASE_URL');
  const anonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}


export default getSupabaseServerClient;
