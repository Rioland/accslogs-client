/**
 * eBills Africa API client (server-only).
 * Docs: https://ebills.africa/api/
 * Base: https://ebills.africa/wp-json
 */

import { createHmac, timingSafeEqual } from "crypto";

const BASE_URL =
  process.env.EBILLS_BASE_URL?.replace(/\/$/, "") ||
  "https://ebills.africa/wp-json";

type TokenCache = { token: string; expiresAt: number };
let tokenCache: TokenCache | null = null;

export type EbillsProductType =
  | "airtime"
  | "data"
  | "electricity"
  | "tv"
  | "betting"
  | "epins";

export class EbillsError extends Error {
  status: number;
  code?: string;
  payload?: unknown;

  constructor(message: string, status = 500, code?: string, payload?: unknown) {
    super(message);
    this.name = "EbillsError";
    this.status = status;
    this.code = code;
    this.payload = payload;
  }
}

function requireCreds() {
  const username = process.env.EBILLS_USERNAME?.trim();
  const password = process.env.EBILLS_PASSWORD?.trim();
  if (!username || !password) {
    throw new EbillsError(
      "eBills is not configured. Set EBILLS_USERNAME and EBILLS_PASSWORD.",
      503,
      "not_configured",
    );
  }
  return { username, password };
}

export async function getEbillsAccessToken(force = false): Promise<string> {
  if (
    !force &&
    tokenCache &&
    tokenCache.expiresAt > Date.now() + 60_000
  ) {
    return tokenCache.token;
  }

  const { username, password } = requireCreds();
  const res = await fetch(`${BASE_URL}/jwt-auth/v1/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.token) {
    const hint =
      res.status === 403
        ? " (Often means your Vercel/Netlify outbound IP is not whitelisted in eBills → Dashboard → Account → Developer.)"
        : "";
    throw new EbillsError(
      `${data?.message || "Failed to authenticate with eBills"}${hint}`,
      res.status || 502,
      data?.code,
      data,
    );
  }

  // The docs claim 7 days, but eBills invalidates tokens well before that
  // ("Token has been invalidated. Please generate a new JWT.") — it appears to
  // keep only one active token per account, so any other instance minting a
  // token kills this one. Cache briefly and lean on the 401/403 retry in
  // ebillsFetch as the real safety net; a multi-day cache guarantees that every
  // request after the first invalidation pays a wasted round trip.
  tokenCache = {
    token: data.token,
    expiresAt: Date.now() + 60 * 60 * 1000,
  };
  return data.token;
}

async function ebillsFetch<T = unknown>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth = true, headers, ...rest } = options;
  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string> | undefined),
  };

  if (auth) {
    finalHeaders.Authorization = `Bearer ${await getEbillsAccessToken()}`;
  }

  let res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
  });

  // Retry once on auth failure with a fresh token
  if (auth && (res.status === 401 || res.status === 403)) {
    finalHeaders.Authorization = `Bearer ${await getEbillsAccessToken(true)}`;
    res = await fetch(`${BASE_URL}${path}`, {
      ...rest,
      headers: finalHeaders,
    });
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok || (data?.code && data.code !== "success" && res.status >= 400)) {
    throw new EbillsError(
      data?.message || `eBills request failed (${res.status})`,
      res.status || 502,
      data?.code,
      data,
    );
  }
  return data as T;
}

export async function getDataVariations(serviceId?: string) {
  const q = serviceId ? `?service_id=${encodeURIComponent(serviceId)}` : "";
  return ebillsFetch(`/api/v2/variations/data${q}`, { auth: false, method: "GET" });
}

export async function getTvVariations(serviceId?: string) {
  const q = serviceId ? `?service_id=${encodeURIComponent(serviceId)}` : "";
  return ebillsFetch(`/api/v2/variations/tv${q}`, { auth: false, method: "GET" });
}

export async function verifyCustomer(input: {
  customer_id: string;
  service_id: string;
  variation_id?: string;
}) {
  return ebillsFetch("/api/v2/verify-customer", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function purchaseAirtime(input: {
  request_id: string;
  phone: string;
  service_id: string;
  amount: number;
}) {
  return ebillsFetch("/api/v2/airtime", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function purchaseData(input: {
  request_id: string;
  phone: string;
  service_id: string;
  variation_id: string;
}) {
  return ebillsFetch("/api/v2/data", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function purchaseElectricity(input: {
  request_id: string;
  customer_id: string;
  service_id: string;
  variation_id: string;
  amount: number;
}) {
  return ebillsFetch("/api/v2/electricity", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function purchaseTv(input: {
  request_id: string;
  customer_id: string;
  service_id: string;
  variation_id: string;
  amount?: number;
}) {
  return ebillsFetch("/api/v2/tv", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/**
 * Betting service_id values are CASE-SENSITIVE at eBills ("Bet9ja", not
 * "bet9ja"), unlike airtime/data/tv which are lowercase. Keep this list as the
 * canonical casing and never lowercase a betting service_id.
 */
// LiveScoreBet is documented but the biller is not provisioned upstream
// ("No biller found with id: LIVESCOREBET"), so it is deliberately excluded.
export const BETTING_SERVICES = [
  "1xBet",
  "BangBet",
  "Bet9ja",
  "BetKing",
  "BetLand",
  "BetLion",
  "BetWay",
  "CloudBet",
  "MerryBet",
  "NaijaBet",
  "NairaBet",
  "SportyBet",
  "SupaBet",
] as const;

export const BETTING_MIN_AMOUNT = 100;
export const BETTING_MAX_AMOUNT = 100_000;

/** Resolve user input to the provider's exact casing, or null if unsupported. */
export function normalizeBettingServiceId(input: string): string | null {
  const target = input.trim().toLowerCase();
  return BETTING_SERVICES.find((s) => s.toLowerCase() === target) ?? null;
}

export const EPINS_NETWORKS = ["mtn", "airtel", "glo", "9mobile"] as const;
export const EPINS_VALUES = [100, 200, 500] as const;
export const EPINS_MIN_QUANTITY = 1;
export const EPINS_MAX_QUANTITY = 40;

export async function purchaseBetting(input: {
  request_id: string;
  customer_id: string;
  service_id: string;
  amount: number;
}) {
  return ebillsFetch("/api/v2/betting", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function purchaseEpins(input: {
  request_id: string;
  service_id: string;
  value: number;
  quantity: number;
}) {
  return ebillsFetch("/api/v2/epins", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export type Epin = {
  amount?: string;
  pin?: string;
  serial?: string;
  instruction?: string;
};

/**
 * Pins are only present once the order reaches completed-api; on
 * processing-api the field is null and must be fetched later via requery.
 */
export function extractEpins(payload: unknown): Epin[] {
  const pins = (payload as { data?: { epins?: unknown } })?.data?.epins;
  return Array.isArray(pins) ? (pins as Epin[]) : [];
}

export async function requeryOrder(request_id: string) {
  return ebillsFetch("/api/v2/requery", {
    method: "POST",
    body: JSON.stringify({ request_id }),
  });
}

/* ------------------------------------------------------------------ */
/*  Webhook notifications                                              */
/* ------------------------------------------------------------------ */

export type EbillsWebhookPayload = {
  order_id?: number | string;
  status?: string;
  product_name?: string;
  quantity?: number;
  amount?: string | number;
  amount_charged?: string | number;
  date_created?: string;
  date_updated?: string;
  request_id?: string;
  meta_data?: Record<string, unknown>;
  timestamp?: number;
};

/**
 * Verify the X-Signature header against the RAW request body.
 *
 * eBills signs with HMAC-SHA256 keyed on the account's user PIN. The docs do
 * not state the encoding, so both hex and base64 are accepted. Must be given
 * the exact bytes received — re-serialising parsed JSON will not match.
 */
export function verifyEbillsWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  const pin = process.env.EBILLS_USER_PIN?.trim();
  if (!pin || !signatureHeader) return false;

  const provided = signatureHeader.replace(/^(HMAC-)?SHA-?256=/i, "").trim();
  const mac = createHmac("sha256", pin).update(rawBody, "utf8").digest();

  return (
    timingSafeEqualStr(provided, mac.toString("hex")) ||
    timingSafeEqualStr(provided, mac.toString("base64"))
  );
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** True when a requery confirms the provider really refunded this order. */
export function isProviderRefunded(payload: unknown): boolean {
  const data = (payload as { data?: { status?: string } })?.data;
  const status = String(data?.status || "").toLowerCase();
  return status === "refunded" || status === "cancelled";
}

export function isProviderSuccess(payload: unknown): boolean {
  const p = payload as { code?: string; message?: string; data?: { status?: string } };
  if (!p) return false;
  if (p.code === "success") return true;
  const status = p.data?.status || "";
  return (
    status === "completed-api" ||
    status === "initiated-api" ||
    status === "processing-api" ||
    status === "queued-api"
  );
}

export function extractProviderFields(payload: unknown) {
  const data = (payload as { data?: Record<string, unknown> })?.data || {};
  return {
    provider_order_id: data.order_id != null ? String(data.order_id) : null,
    amount_charged:
      data.amount_charged != null ? Number(data.amount_charged) : null,
    discount: data.discount != null ? Number(data.discount) : null,
    provider_token: data.token != null ? String(data.token) : null,
    provider_units: data.units != null ? String(data.units) : null,
    status: data.status != null ? String(data.status) : null,
  };
}
