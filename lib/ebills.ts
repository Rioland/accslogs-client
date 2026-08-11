/**
 * eBills Africa API client (server-only).
 * Docs: https://ebills.africa/api/
 * Base: https://ebills.africa/wp-json
 */

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

  // Docs: token expires after 7 days — refresh a bit early
  tokenCache = {
    token: data.token,
    expiresAt: Date.now() + 6 * 24 * 60 * 60 * 1000,
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

export async function requeryOrder(request_id: string) {
  return ebillsFetch("/api/v2/requery", {
    method: "POST",
    body: JSON.stringify({ request_id }),
  });
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
