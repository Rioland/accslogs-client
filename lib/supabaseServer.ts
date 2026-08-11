import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client factory. Uses lazy init so env vars are read at
// request time (not module load), which is more reliable in API routes/server.

function getEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

// These clients are stateless (no session persistence), so one instance per
// process is safe and avoids rebuilding the client on every request.
const AUTH_OPTS = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
} as const;

function createAdminClient() {
  const url = getEnv('NEXT_PUBLIC_SUPABASE_URL');
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE?.trim();
  if (!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, AUTH_OPTS);
}

function createServerClient() {
  const url = getEnv('NEXT_PUBLIC_SUPABASE_URL');
  const anonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  return createClient(url, anonKey, AUTH_OPTS);
}

let adminClient: ReturnType<typeof createAdminClient> | null = null;
let serverClient: ReturnType<typeof createServerClient> | null = null;

/** Server client with service role - bypasses RLS. Use only in server routes (e.g. webhooks). */
export function getSupabaseAdminClient() {
  adminClient ??= createAdminClient();
  return adminClient;
}

/** Server client with anon key - RLS applies. Use for RPCs that bypass RLS. */
export function getSupabaseServerClient() {
  serverClient ??= createServerClient();
  return serverClient;
}

/**
 * True when a query failed because the table has not been migrated yet.
 * PostgREST reports this as PGRST205 ("Could not find the table ... in the
 * schema cache"), NOT as Postgres's "relation does not exist", so matching on
 * the latter alone silently misses it.
 */
export function isMissingTableError(
  error: { code?: string; message?: string } | null | undefined,
) {
  if (!error) return false;
  return (
    error.code === 'PGRST205' ||
    /schema cache|does not exist/i.test(error.message || '')
  );
}


export default getSupabaseServerClient;
