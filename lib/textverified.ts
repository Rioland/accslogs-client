/**
 * TextVerified API v2 client (server-only).
 * Docs: https://www.textverified.com/docs/api/v2
 * Base: https://www.textverified.com
 */

import crypto from "crypto";

const BASE_URL =
  process.env.TEXTVERIFIED_BASE_URL?.replace(/\/$/, "") ||
  "https://www.textverified.com";

type TokenCache = { token: string; expiresAt: number };
let tokenCache: TokenCache | null = null;

/**
 * When our own credentials are rejected, every subsequent request would
 * otherwise pay a full round trip to be told the same thing. Fail fast for a
 * short window instead — short enough that a corrected key self-heals quickly.
 */
const AUTH_FAILURE_COOLDOWN_MS = 60_000;
let authFailedUntil = 0;

export class TextVerifiedError extends Error {
  status: number;
  code?: string;
  payload?: unknown;

  constructor(message: string, status = 500, code?: string, payload?: unknown) {
    super(message);
    this.name = "TextVerifiedError";
    this.status = status;
    this.code = code;
    this.payload = payload;
  }
}

function requireCreds() {
  const apiKey = process.env.TEXTVERIFIED_API_KEY?.trim();
  const username = process.env.TEXTVERIFIED_API_USERNAME?.trim();
  if (!apiKey || !username) {
    throw new TextVerifiedError(
      "TextVerified is not configured. Set TEXTVERIFIED_API_KEY and TEXTVERIFIED_API_USERNAME.",
      503,
      "not_configured",
    );
  }
  return { apiKey, username };
}

/**
 * Convert a TextVerified USD price into the naira amount charged to the wallet.
 *
 *   (usd x rate) x (1 + markup%) + flat fee
 *
 * The flat fee is what guarantees a floor of profit on cheap services, where a
 * percentage alone earns almost nothing. This is the single source of truth for
 * both the price quoted in the UI and the amount actually debited — they must
 * never be calculated separately or a user can be shown one price and charged
 * another.
 */
export function usdToNgn(usd: number): number {
  const rate = Number(process.env.TEXTVERIFIED_USD_NGN_RATE || "1600");
  const markup = Number(process.env.TEXTVERIFIED_MARKUP_PERCENT || "40");
  const flatFee = Number(process.env.TEXTVERIFIED_FLAT_FEE_NGN || "500");
  const safeRate = Number.isFinite(rate) && rate > 0 ? rate : 1600;
  const safeMarkup = Number.isFinite(markup) && markup >= 0 ? markup : 40;
  const safeFlat = Number.isFinite(flatFee) && flatFee >= 0 ? flatFee : 500;
  const ngn = usd * safeRate * (1 + safeMarkup / 100) + safeFlat;
  return Math.ceil(ngn);
}

/**
 * Bound outbound calls to TextVerified so a stall can't hang a request
 * indefinitely. Kept generously above their typical response time — the
 * provider sits behind Cloudflare and can take ~10s on a slow network, so too
 * tight a value kills requests that would have succeeded.
 */
const REQUEST_TIMEOUT_MS = Number(process.env.TEXTVERIFIED_TIMEOUT_MS || "30000");

/** Wraps fetch so transport failures surface as a typed 504 instead of a raw TypeError. */
async function tvRawFetch(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    const isTimeout =
      err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
    throw new TextVerifiedError(
      isTimeout
        ? "TextVerified did not respond in time. Please try again."
        : "Could not reach TextVerified. Please try again.",
      504,
      "upstream_unreachable",
    );
  }
}

export async function getTextVerifiedToken(force = false): Promise<string> {
  if (!force && tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.token;
  }

  if (Date.now() < authFailedUntil) {
    throw new TextVerifiedError(
      "SMS provider credentials are invalid. Please contact support.",
      503,
      "provider_auth_failed",
    );
  }

  const { apiKey, username } = requireCreds();
  const res = await tvRawFetch(`${BASE_URL}/api/pub/v2/auth`, {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "X-API-USERNAME": username,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.token) {
    // Our credentials being rejected is a server-side misconfiguration, not a
    // problem with the end user's session. Never surface it as 401/403 or the
    // dashboard will tell them to log in again.
    console.error(
      `[textverified] auth failed (${res.status}) — check TEXTVERIFIED_API_KEY / TEXTVERIFIED_API_USERNAME`,
    );
    if (res.status === 401 || res.status === 403) {
      authFailedUntil = Date.now() + AUTH_FAILURE_COOLDOWN_MS;
    }
    throw new TextVerifiedError(
      res.status === 401 || res.status === 403
        ? "SMS provider credentials are invalid. Please contact support."
        : data?.message || data?.title || "Failed to authenticate with TextVerified",
      503,
      "provider_auth_failed",
      data,
    );
  }

  const expiresAt = data.expiresAt
    ? new Date(data.expiresAt).getTime()
    : Date.now() + 50 * 60 * 1000;

  authFailedUntil = 0;
  tokenCache = { token: data.token, expiresAt };
  return data.token;
}

async function tvFetch<T = unknown>(
  path: string,
  options: RequestInit & { parseJson?: boolean } = {},
): Promise<{ data: T; headers: Headers; status: number }> {
  const { parseJson = true, headers, ...rest } = options;
  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(headers as Record<string, string> | undefined),
  };

  finalHeaders.Authorization = `Bearer ${await getTextVerifiedToken()}`;

  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;

  let res = await tvRawFetch(url, { ...rest, headers: finalHeaders });

  if (res.status === 401 || res.status === 403) {
    finalHeaders.Authorization = `Bearer ${await getTextVerifiedToken(true)}`;
    res = await tvRawFetch(url, { ...rest, headers: finalHeaders });

    // Still rejected with a freshly minted token: it's our credentials, not
    // the caller's. Surface 503 so this isn't mistaken for a session problem.
    if (res.status === 401 || res.status === 403) {
      throw new TextVerifiedError(
        "SMS provider rejected our credentials. Please contact support.",
        503,
        "provider_auth_failed",
      );
    }
  }

  if (res.status === 429) {
    throw new TextVerifiedError(
      "TextVerified rate limit hit. Try again in a moment.",
      429,
      "rate_limited",
    );
  }

  const data = parseJson
    ? ((await res.json().catch(() => ({}))) as T)
    : (null as T);

  if (!res.ok) {
    const err = data as { message?: string; title?: string; detail?: string };
    throw new TextVerifiedError(
      err?.message || err?.detail || err?.title || `TextVerified error (${res.status})`,
      res.status || 502,
      undefined,
      data,
    );
  }

  return { data, headers: res.headers, status: res.status };
}

export type TvService = {
  serviceName?: string;
  service_name?: string;
  capability?: string;
  [key: string]: unknown;
};

function unwrapServices(data: unknown): TvService[] {
  if (Array.isArray(data)) return data as TvService[];
  const nested = (data as { data?: TvService[] })?.data;
  return Array.isArray(nested) ? nested : [];
}

export type NormalizedService = {
  serviceName: string;
  /** Properly-cased label from the provider, e.g. "WhatsApp". */
  label: string;
  /** Lowercased capabilities this service actually supports. */
  capabilities: string[];
};

/**
 * The provider returns ONE ROW PER CAPABILITY, so every service appears twice
 * ("whatsapp"/Sms and "whatsapp"/Voice) — 4,551 rows for 2,293 real services.
 * Collapsing them halves the payload, stops the picker showing each service
 * twice, and tells the UI which delivery methods are genuinely available.
 */
export function normalizeServices(raw: TvService[]): NormalizedService[] {
  const byName = new Map<string, NormalizedService>();

  for (const s of raw) {
    const serviceName = String(s.serviceName || s.service_name || "").trim();
    if (!serviceName) continue;

    const capability = String(s.capability || "sms").toLowerCase();
    const label = String((s as { description?: string }).description || "").trim();

    const existing = byName.get(serviceName);
    if (existing) {
      if (!existing.capabilities.includes(capability)) {
        existing.capabilities.push(capability);
      }
      continue;
    }
    byName.set(serviceName, {
      serviceName,
      label: label || serviceName,
      capabilities: [capability],
    });
  }

  return [...byName.values()].sort((a, b) =>
    a.serviceName.localeCompare(b.serviceName),
  );
}

/**
 * The service catalogue is large (thousands of entries) and effectively static,
 * so cache it per reservation type instead of hitting TextVerified on every
 * dashboard load / tab switch. In-flight requests are shared so a burst of
 * concurrent callers only produces one upstream call.
 */
const SERVICES_TTL_MS = 60 * 60 * 1000;
type ServicesCacheEntry = {
  expiresAt: number;
  value?: TvService[];
  inflight?: Promise<TvService[]>;
};
const servicesCache = new Map<string, ServicesCacheEntry>();

async function listServices(reservationType: string): Promise<TvService[]> {
  const cached = servicesCache.get(reservationType);
  if (cached?.value && cached.expiresAt > Date.now()) return cached.value;
  if (cached?.inflight) return cached.inflight;

  const inflight = (async () => {
    const { data } = await tvFetch<TvService[] | { data?: TvService[] }>(
      `/api/pub/v2/services?numberType=mobile&reservationType=${encodeURIComponent(reservationType)}`,
      { method: "GET" },
    );
    const services = unwrapServices(data);
    servicesCache.set(reservationType, {
      value: services,
      expiresAt: Date.now() + SERVICES_TTL_MS,
    });
    return services;
  })().catch((err) => {
    servicesCache.delete(reservationType);
    throw err;
  });

  servicesCache.set(reservationType, { inflight, expiresAt: 0 });
  return inflight;
}

export async function listVerificationServices(): Promise<TvService[]> {
  return listServices("verification");
}

export async function getVerificationPricing(input: {
  serviceName: string;
  capability?: string;
  /** Selecting a specific area code is priced differently. */
  areaCode?: boolean;
}) {
  // areaCode/carrier are booleans meaning "let me choose a specific one",
  // and all five fields are required by the schema.
  const body = {
    serviceName: input.serviceName,
    areaCode: input.areaCode ?? false,
    carrier: false,
    numberType: "mobile",
    capability: input.capability || "sms",
  };
  const { data } = await tvFetch<{ price?: number; serviceName?: string }>(
    "/api/pub/v2/pricing/verifications",
    { method: "POST", body: JSON.stringify(body) },
  );
  const price = Number(data?.price ?? 0);
  return { usd: price, raw: data };
}

export type CreatedVerification = {
  id: string;
  number?: string;
  phoneNumber?: string;
  serviceName?: string;
  endsAt?: string;
  createdAt?: string;
  state?: string;
  [key: string]: unknown;
};

export async function createVerification(input: {
  serviceName: string;
  capability?: string;
  maxPrice?: number;
  /** Optional preferred US area codes, e.g. ["205"]. */
  areaCodes?: string[];
}): Promise<CreatedVerification> {
  const body: Record<string, unknown> = {
    serviceName: input.serviceName,
    capability: input.capability || "sms",
  };
  if (input.maxPrice != null) body.maxPrice = input.maxPrice;
  if (input.areaCodes?.length) body.areaCodeSelectOption = input.areaCodes;

  // 201 returns only a follow-up link: { method, href }. The verification
  // itself (number, id, state) lives behind that href.
  const { data, headers } = await tvFetch<{
    href?: string;
    method?: string;
  }>("/api/pub/v2/verifications", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const followUrl = data?.href || headers.get("location") || undefined;
  if (!followUrl) {
    throw new TextVerifiedError(
      "TextVerified accepted the order but returned no verification link",
      502,
      "no_verification_href",
      data,
    );
  }

  const { data: details } = await tvFetch<CreatedVerification>(followUrl, {
    method: (data?.method || "GET").toUpperCase(),
  });
  return details;
}

export type TvCapability = "sms" | "voice" | "smsAndVoiceCombo";

/** Stock for a service before we take the customer's money. */
export async function getVerificationInventory(input: {
  serviceName: string;
  capability?: TvCapability;
}): Promise<number> {
  const { data } = await tvFetch<{ availableQuantity?: number }>(
    "/api/pub/v2/inventory/verifications",
    {
      method: "POST",
      body: JSON.stringify({
        serviceName: input.serviceName,
        capability: input.capability || "sms",
        numberType: "mobile",
      }),
    },
  );
  return Number(data?.availableQuantity ?? 0);
}

export async function getAccountDetails() {
  const { data } = await tvFetch<{ username?: string; currentBalance?: number }>(
    "/api/pub/v2/account/me",
    { method: "GET" },
  );
  return {
    username: data?.username ?? null,
    balance: Number(data?.currentBalance ?? 0),
  };
}

export type TvAreaCode = { areaCode: string; state: string };

const AREA_CODES_TTL_MS = 24 * 60 * 60 * 1000;
let areaCodeCache: { value: TvAreaCode[]; expiresAt: number } | null = null;

/** 355 US area codes with their state — effectively static, cached for a day. */
export async function listAreaCodes(): Promise<TvAreaCode[]> {
  if (areaCodeCache && areaCodeCache.expiresAt > Date.now()) {
    return areaCodeCache.value;
  }
  const { data } = await tvFetch<TvAreaCode[] | { data?: TvAreaCode[] }>(
    "/api/pub/v2/area-codes",
    { method: "GET" },
  );
  const list = Array.isArray(data)
    ? data
    : Array.isArray((data as { data?: TvAreaCode[] })?.data)
      ? (data as { data: TvAreaCode[] }).data
      : [];
  areaCodeCache = { value: list, expiresAt: Date.now() + AREA_CODES_TTL_MS };
  return list;
}

/* ------------------------------------------------------------------ */
/*  Recovery: reuse / reactivate / report                              */
/* ------------------------------------------------------------------ */

/** Both reuse and reactivate return 201 { method, href } like create does. */
async function followVerificationAction(
  path: string,
): Promise<CreatedVerification> {
  const { data, headers } = await tvFetch<{ href?: string; method?: string }>(
    path,
    { method: "POST" },
  );
  const followUrl = data?.href || headers.get("location") || undefined;
  if (!followUrl) {
    throw new TextVerifiedError(
      "TextVerified accepted the request but returned no verification link",
      502,
      "no_verification_href",
      data,
    );
  }
  const { data: details } = await tvFetch<CreatedVerification>(followUrl, {
    method: (data?.method || "GET").toUpperCase(),
  });
  return details;
}

/** Reuse the same number for the same service — only shortly after completion. */
export async function reuseVerification(id: string) {
  return followVerificationAction(
    `/api/pub/v2/verifications/${encodeURIComponent(id)}/reuse`,
  );
}

/** Reactivate a completed verification that can no longer be reused. */
export async function reactivateVerification(id: string) {
  return followVerificationAction(
    `/api/pub/v2/verifications/${encodeURIComponent(id)}/reactivate`,
  );
}

/** Report a bad number ("code not received", "number already in use"). */
export async function reportVerification(id: string) {
  await tvFetch(`/api/pub/v2/verifications/${encodeURIComponent(id)}/report`, {
    method: "POST",
    parseJson: false,
  });
  return true;
}

/**
 * Eligibility for the recovery actions, read off verification details. The
 * shapes mirror `cancel`: { canX, link }.
 */
export function extractActionAvailability(v: CreatedVerification) {
  const flag = (key: "cancel" | "reuse" | "reactivate" | "report") => {
    const node = v[key] as
      | { canCancel?: boolean; canReuse?: boolean; canReactivate?: boolean; canReport?: boolean }
      | undefined;
    if (!node || typeof node !== "object") return false;
    const value =
      node.canCancel ?? node.canReuse ?? node.canReactivate ?? node.canReport;
    // Absent flag with a present link means the action is offered.
    return value ?? true;
  };
  return {
    canCancel: flag("cancel"),
    canReuse: flag("reuse"),
    canReactivate: flag("reactivate"),
    canReport: flag("report"),
  };
}

export async function getVerification(id: string) {
  const { data } = await tvFetch<CreatedVerification>(
    `/api/pub/v2/verifications/${encodeURIComponent(id)}`,
    { method: "GET" },
  );
  return data;
}

export type TvSms = {
  id?: string;
  from?: string;
  fromValue?: string;
  to?: string;
  toValue?: string;
  smsContent?: string;
  sms_content?: string;
  parsedCode?: string;
  parsed_code?: string;
  createdAt?: string;
  created_at?: string;
  [key: string]: unknown;
};

export async function listSms(params: {
  to?: string;
  reservationId?: string;
}): Promise<TvSms[]> {
  const q = new URLSearchParams();
  if (params.to) q.set("to", params.to);
  if (params.reservationId) q.set("reservationId", params.reservationId);
  const qs = q.toString();
  const { data } = await tvFetch<TvSms[] | { data?: TvSms[] }>(
    `/api/pub/v2/sms${qs ? `?${qs}` : ""}`,
    { method: "GET" },
  );
  if (Array.isArray(data)) return data;
  if (Array.isArray((data as { data?: TvSms[] })?.data)) {
    return (data as { data: TvSms[] }).data;
  }
  return [];
}

export async function cancelVerification(id: string) {
  // Details expose cancel as { canCancel, link }. Respect canCancel so we don't
  // fire a doomed request, then fall back to the documented cancel endpoint.
  try {
    const details = await getVerification(id);
    const cancel = details.cancel as
      | { canCancel?: boolean; link?: { href?: string; method?: string } | string }
      | undefined;

    if (cancel && cancel.canCancel === false) {
      throw new TextVerifiedError(
        "This verification can no longer be cancelled",
        409,
        "cannot_cancel",
      );
    }

    const link = cancel?.link;
    const href = typeof link === "string" ? link : link?.href;
    if (href) {
      await tvFetch(href, {
        method: (typeof link === "string" ? "POST" : link?.method || "POST").toUpperCase(),
      });
      return true;
    }
  } catch (err) {
    if (err instanceof TextVerifiedError && err.code === "cannot_cancel") throw err;
    // otherwise fall through to the documented endpoint
  }

  await tvFetch(`/api/pub/v2/verifications/${encodeURIComponent(id)}/cancel`, {
    method: "POST",
  });
  return true;
}

export function extractPhone(v: CreatedVerification): string | null {
  return (
    v.number ||
    v.phoneNumber ||
    (v as { phone_number?: string }).phone_number ||
    null
  );
}

export function extractSmsFields(msg: TvSms) {
  return {
    code:
      msg.parsedCode ||
      msg.parsed_code ||
      extractCodeFromText(msg.smsContent || msg.sms_content || "") ||
      null,
    content: msg.smsContent || msg.sms_content || null,
  };
}

function extractCodeFromText(text: string): string | null {
  const m = text.match(/\b(\d{4,8})\b/);
  return m?.[1] || null;
}

/* ------------------------------------------------------------------ */
/*  Rentals                                                             */
/* ------------------------------------------------------------------ */

export type RentalDurationApi =
  | "oneDay"
  | "threeDay"
  | "sevenDay"
  | "fourteenDay"
  | "thirtyDay"
  | "ninetyDay"
  | "oneYear";

export const RENTAL_DURATIONS: Array<{
  value: RentalDurationApi;
  label: string;
  renewableOk: boolean;
}> = [
  { value: "oneDay", label: "1 day", renewableOk: false },
  { value: "threeDay", label: "3 days", renewableOk: false },
  { value: "sevenDay", label: "7 days", renewableOk: false },
  { value: "fourteenDay", label: "14 days", renewableOk: false },
  { value: "thirtyDay", label: "30 days", renewableOk: true },
  { value: "ninetyDay", label: "90 days", renewableOk: true },
  { value: "oneYear", label: "1 year", renewableOk: true },
];

export type CreatedRental = {
  id: string;
  number?: string;
  phoneNumber?: string;
  serviceName?: string;
  endsAt?: string;
  createdAt?: string;
  state?: string;
  alwaysOn?: boolean;
  isRenewable?: boolean;
  [key: string]: unknown;
};

/** `renewable` and `nonrenewable` are distinct catalogues — don't conflate them. */
export async function listRentalServices(
  isRenewable: boolean,
): Promise<TvService[]> {
  return listServices(isRenewable ? "renewable" : "nonrenewable");
}

export async function getRentalPricing(input: {
  serviceName: string;
  capability?: string;
  isRenewable: boolean;
  duration: RentalDurationApi;
  alwaysOn?: boolean;
  areaCode?: boolean;
}) {
  const body = {
    serviceName: input.serviceName,
    areaCode: input.areaCode ?? false,
    numberType: "mobile",
    capability: input.capability || "sms",
    alwaysOn: input.alwaysOn ?? true,
    callForwarding: false,
    isRenewable: input.isRenewable,
    duration: input.duration,
  };
  const { data } = await tvFetch<{ price?: number; Price?: number }>(
    "/api/pub/v2/pricing/rentals",
    { method: "POST", body: JSON.stringify(body) },
  );
  const price = Number(
    (data as { price?: number }).price ??
      (data as { Price?: number }).Price ??
      0,
  );
  return { usd: price, raw: data };
}

export async function createRental(input: {
  serviceName: string;
  capability?: string;
  isRenewable: boolean;
  duration: RentalDurationApi;
  alwaysOn?: boolean;
  allowBackOrder?: boolean;
}): Promise<CreatedRental> {
  const body = {
    serviceName: input.serviceName,
    capability: input.capability || "sms",
    numberType: "mobile",
    isRenewable: input.isRenewable,
    duration: input.duration,
    alwaysOn: input.alwaysOn ?? true,
    allowBackOrderReservations: input.allowBackOrder ?? false,
  };

  const { data, headers, status } = await tvFetch<
    CreatedRental | { href?: string; method?: string } | Record<string, unknown>
  >("/api/pub/v2/reservations/rental", {
    method: "POST",
    body: JSON.stringify(body),
  });

  // Create returns a follow-up action / Location for the sale
  const location = headers.get("location") || headers.get("Location");
  let sale: Record<string, unknown> = data as Record<string, unknown>;

  if (location) {
    const details = await tvFetch<Record<string, unknown>>(location, {
      method: "GET",
    });
    sale = details.data;
  } else if (
    data &&
    typeof data === "object" &&
    "href" in data &&
    typeof (data as { href?: string }).href === "string"
  ) {
    const follow = data as { href: string; method?: string };
    const details = await tvFetch<Record<string, unknown>>(follow.href, {
      method: (follow.method || "GET").toUpperCase(),
    });
    sale = details.data;
  } else if (status === 201 || status === 200) {
    sale = data as Record<string, unknown>;
  }

  // Sale contains reservations[]; expand the first one
  const reservations = (sale.reservations ||
    sale.Reservations ||
    []) as Array<{ id?: string; href?: string; number?: string }>;

  const first = reservations[0];
  if (!first) {
    // Maybe the sale itself is already a reservation
    if (sale.id || sale.number || sale.phoneNumber) {
      return sale as CreatedRental;
    }
    throw new TextVerifiedError(
      "Rental created but no reservation was returned",
      502,
      "no_reservation",
      sale,
    );
  }

  const reservationId = String(first.id || "");
  if (reservationId) {
    const path = input.isRenewable
      ? `/api/pub/v2/reservations/rental/renewable/${encodeURIComponent(reservationId)}`
      : `/api/pub/v2/reservations/rental/nonrenewable/${encodeURIComponent(reservationId)}`;
    try {
      const details = await tvFetch<CreatedRental>(path, { method: "GET" });
      return details.data;
    } catch {
      const fallback = await tvFetch<CreatedRental>(
        `/api/pub/v2/reservations/${encodeURIComponent(reservationId)}`,
        { method: "GET" },
      );
      return fallback.data;
    }
  }

  return first as CreatedRental;
}

export async function getRental(
  id: string,
  isRenewable: boolean,
): Promise<CreatedRental> {
  const path = isRenewable
    ? `/api/pub/v2/reservations/rental/renewable/${encodeURIComponent(id)}`
    : `/api/pub/v2/reservations/rental/nonrenewable/${encodeURIComponent(id)}`;
  try {
    const { data } = await tvFetch<CreatedRental>(path, { method: "GET" });
    return data;
  } catch {
    const { data } = await tvFetch<CreatedRental>(
      `/api/pub/v2/reservations/${encodeURIComponent(id)}`,
      { method: "GET" },
    );
    return data;
  }
}

export async function refundRental(id: string, isRenewable: boolean) {
  const path = isRenewable
    ? `/api/pub/v2/reservations/rental/renewable/${encodeURIComponent(id)}/refund`
    : `/api/pub/v2/reservations/rental/nonrenewable/${encodeURIComponent(id)}/refund`;
  await tvFetch(path, { method: "POST" });
  return true;
}

/* ------------------------------------------------------------------ */
/*  Webhooks                                                            */
/* ------------------------------------------------------------------ */

export type TvWebhookEnvelope<T = unknown> = {
  id: string;
  event: string;
  attempt: number;
  occurredAt: string;
  idempotencyKey: string;
  data: T;
};

export type TvSmsWebhookData = {
  from: string | null;
  to: string;
  createdAt: string;
  smsContent: string | null;
  parsedCode: string | null;
  encrypted: boolean;
  reservationId: string | null;
};

const WEBHOOK_SIGNATURE_PREFIX = "HMAC-SHA512=";

/**
 * Verify the X-Webhook-Signature header against the RAW request body.
 *
 * Must be given the exact bytes TextVerified sent — re-serialising the parsed
 * JSON will not produce a matching hash. Uses a timing-safe comparison so the
 * endpoint can't be used as a signature oracle.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  const secret = process.env.TEXTVERIFIED_WEBHOOK_SECRET?.trim();
  if (!secret || !signatureHeader) return false;

  const provided = signatureHeader.startsWith(WEBHOOK_SIGNATURE_PREFIX)
    ? signatureHeader.slice(WEBHOOK_SIGNATURE_PREFIX.length)
    : signatureHeader;

  const expected = crypto
    .createHmac("sha512", secret)
    .update(rawBody, "utf8")
    .digest("base64");

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function createWakeRequest(reservationId: string) {
  const { data } = await tvFetch<Record<string, unknown>>(
    "/api/pub/v2/wake-requests",
    {
      method: "POST",
      body: JSON.stringify({ reservationId }),
    },
  );
  return data;
}

