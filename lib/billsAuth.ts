import { NextResponse } from "next/server";
import { createClient, type User } from "@supabase/supabase-js";
import { createHash } from "crypto";

export const runtime = "nodejs";

/**
 * Bound the token-validation round trip. Without this it inherits undici's 10s
 * connect timeout, so a flaky network turns every dashboard load — which fires
 * several authenticated requests at once — into a 10s stall per request.
 */
const AUTH_REQUEST_TIMEOUT_MS = Number(
  process.env.SUPABASE_AUTH_TIMEOUT_MS || "6000",
);

// Token validation is stateless, so reuse a single client across requests
// rather than constructing one per API call.
function createAuthClient(url: string, anonKey: string) {
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: (input, init) =>
        fetch(input as RequestInfo, {
          ...init,
          signal: AbortSignal.timeout(AUTH_REQUEST_TIMEOUT_MS),
        }),
    },
  });
}

/**
 * Every authenticated API route validates the bearer token with Supabase, so a
 * single page load costs several identical network round trips. Cache the
 * verified result briefly.
 *
 * The TTL is deliberately short: a cached entry means a token revoked in that
 * window is still accepted, so this trades a few seconds of revocation lag for
 * a large drop in latency and in exposure to network wobble. Entries never
 * outlive the JWT's own expiry.
 */
const TOKEN_CACHE_TTL_MS = 30_000;
const MAX_CACHED_TOKENS = 500;
type CachedAuth = { user: User; expiresAt: number };
const verifiedTokens = new Map<string, CachedAuth>();

function tokenKey(token: string) {
  return createHash("sha256").update(token).digest("base64");
}

/** Seconds-since-epoch expiry from the JWT body, if it is readable. */
function jwtExpiryMs(token: string): number | null {
  const part = token.split(".")[1];
  if (!part) return null;
  try {
    const json = Buffer.from(
      part.replace(/-/g, "+").replace(/_/g, "/"),
      "base64",
    ).toString("utf8");
    const exp = (JSON.parse(json) as { exp?: number }).exp;
    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
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

  const key = tokenKey(token);
  const cached = verifiedTokens.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return { user: cached.user, error: null };
  }
  if (cached) verifiedTokens.delete(key);

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

  // Never cache past the JWT's own expiry, so an expired token can't be
  // resurrected by a cache entry created just before it lapsed.
  const jwtExp = jwtExpiryMs(token);
  const expiresAt = Math.min(
    Date.now() + TOKEN_CACHE_TTL_MS,
    jwtExp ?? Number.POSITIVE_INFINITY,
  );
  if (expiresAt > Date.now()) {
    // Crude bound: this is a latency cache, not a store worth evicting nicely.
    if (verifiedTokens.size >= MAX_CACHED_TOKENS) verifiedTokens.clear();
    verifiedTokens.set(key, { user, expiresAt });
  }

  return { user, error: null };
}

function isTransportError(error: { name?: string; status?: number }) {
  // supabase-js surfaces network failures as AuthRetryableFetchError with no
  // HTTP status, versus a real 401/403 from the auth server.
  return error.name === "AuthRetryableFetchError" || !error.status;
}
