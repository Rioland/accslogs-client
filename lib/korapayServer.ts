// Korapay integration. Server-only: this module reads the merchant secret key,
// so it must never be imported from a client component. It was previously named
// KorapayServerActions.ts and imported by app/ad-funds/page.tsx ("use client"),
// which shipped the live key to the browser. Callers now go through
// app/api/korapay/virtual-account.

import { getSupabaseAdminClient } from "./supabaseServer";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

/** Read lazily so a missing variable fails on request, not at build time. */
export function getKorapaySecretKey(): string {
  return requireEnv("KORAPAY_SECRET_KEY");
}

export const KORAPAY_BASE_URL =
  process.env.NEXT_PUBLIC_KORAPAY_BASE_URL ??
  "https://api.korapay.com/merchant/api/v1";

// Wema Bank; use "000" for sandbox.
const BANK_CODE = process.env.KORAPAY_BANK_CODE ?? "035";

export type KorapayDedicatedAccount = {
  accountNumber: string;
  accountBank: string;
  accountName: string;
};

interface KorapayAccountData {
  account_name: string;
  account_number: string;
  bank_code: string;
  bank_name: string;
  account_reference: string;
  unique_id: string;
  account_status: string;
  currency: string;
}

interface KorapayCreateResponse {
  status: boolean;
  message: string;
  data: KorapayAccountData;
}

/** Existing dedicated account for a user, or null if none has been created. */
export async function getVirtualAccount(
  userId: string,
): Promise<KorapayDedicatedAccount | null> {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("user_virtual_accounts")
    .select("account_number, bank_name, account_name")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return null;
  return {
    accountNumber: data.account_number,
    accountBank: data.bank_name,
    accountName: data.account_name,
  };
}

/** Returns the stored dedicated account, creating one via Korapay if needed. */
export async function getOrCreateVirtualAccount(
  userId: string,
): Promise<KorapayDedicatedAccount> {
  const existing = await getVirtualAccount(userId);
  if (existing) return existing;

  const supabase = getSupabaseAdminClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("account_reference, korapay_customer_id, first_name, last_name")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    throw new Error("Profile not found");
  }

  // Legacy profiles hold a reference but no user_virtual_accounts row.
  if (profile.account_reference) {
    const fetched = await fetchAccountFromKorapay(profile.account_reference);
    if (fetched) {
      await persistAccount(userId, fetched);
      return {
        accountNumber: fetched.account_number,
        accountBank: fetched.bank_name,
        accountName: fetched.account_name,
      };
    }
  }

  const accountName = `${profile.first_name} ${profile.last_name || ""}`.trim();

  const response = await fetch(`${KORAPAY_BASE_URL}/virtual-bank-account`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getKorapaySecretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      account_reference: userId,
      account_name: accountName,
      permanent: true,
      bank_code: BANK_CODE,
      kyc: { bvn: requireEnv("KORAPAY_BVN") },
      customer: { name: accountName },
    }),
  });

  const result: KorapayCreateResponse = await response.json();

  if (!response.ok || !result.status) {
    throw new Error(result.message || "Failed to create virtual account");
  }

  const { data } = result;
  await persistAccount(userId, {
    ...data,
    account_status: data.account_status || "active",
    currency: data.currency || "NGN",
  });

  return {
    accountNumber: data.account_number,
    accountBank: data.bank_name,
    accountName: data.account_name,
  };
}

async function fetchAccountFromKorapay(
  accountReference: string,
): Promise<KorapayAccountData | null> {
  const response = await fetch(
    `${KORAPAY_BASE_URL}/virtual-bank-account/${encodeURIComponent(accountReference)}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${getKorapaySecretKey()}` },
    },
  );

  const result: KorapayCreateResponse = await response.json();
  if (!response.ok || !result.status || !result.data) return null;
  return result.data;
}

async function persistAccount(
  userId: string,
  data: KorapayAccountData,
): Promise<void> {
  const supabase = getSupabaseAdminClient();

  await supabase.from("user_virtual_accounts").upsert(
    {
      user_id: userId,
      account_name: data.account_name,
      account_number: data.account_number,
      bank_code: data.bank_code,
      bank_name: data.bank_name,
      account_reference: data.account_reference,
      korapay_unique_id: data.unique_id,
      account_status: data.account_status,
      currency: data.currency,
    },
    { onConflict: "user_id" },
  );

  await supabase
    .from("profiles")
    .update({
      korapay_customer_id: data.unique_id,
      account_reference: data.account_reference,
    })
    .eq("id", userId);
}
