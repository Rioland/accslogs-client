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

// For server usage, disable client-side auth features.
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
