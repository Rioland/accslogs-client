import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// Token validation is stateless, so reuse a single client across requests
// rather than constructing one per API call.
function createAuthClient(url: string, anonKey: string) {
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

let authClient: ReturnType<typeof createAuthClient> | null = null;

function getAuthClient() {
  if (authClient) return authClient;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnon) return null;
  authClient = createAuthClient(supabaseUrl, supabaseAnon);
  return authClient;
}

export async function getAuthedUser(req: Request) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return { user: null, error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
  }

  const supabaseAuth = getAuthClient();
  if (!supabaseAuth) {
    return {
      user: null,
      error: NextResponse.json({ message: "Server configuration error" }, { status: 500 }),
    };
  }

  const {
    data: { user },
    error,
  } = await supabaseAuth.auth.getUser(token);

  // A transport failure (Supabase unreachable, DNS/connect timeout) is not an
  // auth failure. Reporting it as 401 tells the user to log in again when the
  // real problem is upstream, and hides the outage during debugging.
  if (error && isTransportError(error)) {
    console.error("[auth] could not reach Supabase:", error.message);
    return {
      user: null,
      error: NextResponse.json(
        { message: "Authentication service is unreachable. Please try again." },
        { status: 503 },
      ),
    };
  }

  if (error || !user) {
    // Logged so a 401 in the server log is attributable to the caller's token
    // rather than being confused with an upstream provider rejection.
    console.warn(
      `[auth] rejected caller token: ${error?.message || "no user for token"}`,
    );
    return { user: null, error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
  }

  return { user, error: null };
}

function isTransportError(error: { name?: string; status?: number }) {
  // supabase-js surfaces network failures as AuthRetryableFetchError with no
  // HTTP status, versus a real 401/403 from the auth server.
  return error.name === "AuthRetryableFetchError" || !error.status;
}
