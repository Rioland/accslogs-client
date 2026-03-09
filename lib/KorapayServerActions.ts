/* eslint-disable @typescript-eslint/no-explicit-any */

import supabaseClient from "./supabaseClient";

const KORAPAY_SECRET_KEY =
  process.env.KORAPAY_SECRET_KEY ||
  "sk_live_5orcssbSsdPCCPKUuWdSJJvQdtKSTb4jWBucobPg"!;
const KORAPAY_BASE_URL =
  process.env.NEXT_PUBLIC_KORAPAY_BASE_URL ??
  "https://api.korapay.com/merchant/api/v1";
const BVN = process.env.KORAPAY_BVN ?? "22153211344";
const BANK_CODE = process.env.KORAPAY_BANK_CODE ?? "035"; // Wema Bank; use "000" for sandbox

export type KorapayDedicatedAccount = {
  accountNumber: string;
  accountBank: string;
  accountName: string;
};

interface KorapayCreateResponse {
  status: boolean;
  message: string;
  data: {
    account_name: string;
    account_number: string;
    bank_code: string;
    bank_name: string;
    account_reference: string;
    unique_id: string;
    account_status: string;
    created_at: string;
    currency: string;
    customer?: { name: string };
  };
}

/**
 * Fetches existing dedicated account from DB (for initial page load).
 * Returns null if none exists.
 */
export async function getKorapayDedicatedAccount(
  userId: string,
): Promise<KorapayDedicatedAccount | null> {
  const { data } = await supabaseClient
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

/**
 * Returns existing dedicated account if stored, otherwise creates via Korapay and stores it.
 */
export async function generateKorapayDedicatedAccount(
  id: string,
): Promise<KorapayDedicatedAccount> {
  "use client";

  // 1. Check if we already have stored account details
  const { data: storedAccount } = await supabaseClient
    .from("user_virtual_accounts")
    .select("account_number, bank_name, account_name")
    .eq("user_id", id)
    .maybeSingle();

  if (storedAccount) {
    return {
      accountNumber: storedAccount.account_number,
      accountBank: storedAccount.bank_name,
      accountName: storedAccount.account_name,
    };
  }

  // 2. Check for legacy profile with account_reference (backfill from Korapay)
  const { data: profile, error: profileError } = await supabaseClient
    .from("profiles")
    .select("account_reference, korapay_customer_id, first_name, last_name")
    .eq("id", id)
    .single();

  if (profileError || !profile) {
    throw new Error("Profile not found");
  }

  if (profile.account_reference) {
    const fetched = await fetchAccountFromKorapay(profile.account_reference);
    if (fetched) {
      await storeAccount(id, fetched);
      await supabaseClient
        .from("profiles")
        .update({
          korapay_customer_id: fetched.unique_id,
          account_reference: fetched.account_reference,
        })
        .eq("id", id);
      return {
        accountNumber: fetched.account_number,
        accountBank: fetched.bank_name,
        accountName: fetched.account_name,
      };
    }
  }

  // 3. Create new account via Korapay
  const accountName = `${profile.first_name} ${profile.last_name || ""}`.trim();
  const accountReference = id;

  const response = await fetch(`${KORAPAY_BASE_URL}/virtual-bank-account`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KORAPAY_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      account_reference: accountReference,
      account_name: accountName,
      permanent: true,
      bank_code: BANK_CODE,
      kyc: { bvn: BVN },
      customer: { name: accountName },
    }),
  });

  const result: KorapayCreateResponse = await response.json();

  if (!response.ok || !result.status) {
    throw new Error(result.message || "Failed to create virtual account");
  }

  const { data } = result;
  await storeAccount(id, {
    account_name: data.account_name,
    account_number: data.account_number,
    bank_code: data.bank_code,
    bank_name: data.bank_name,
    account_reference: data.account_reference,
    unique_id: data.unique_id,
    account_status: data.account_status || "active",
    currency: data.currency || "NGN",
  });

  await supabaseClient
    .from("profiles")
    .update({
      korapay_customer_id: data.unique_id,
      account_reference: data.account_reference,
    })
    .eq("id", id);

  return {
    accountNumber: data.account_number,
    accountBank: data.bank_name,
    accountName: data.account_name,
  };
}

async function fetchAccountFromKorapay(
  accountReference: string,
): Promise<KorapayCreateResponse["data"] | null> {
  const response = await fetch(
    `${KORAPAY_BASE_URL}/virtual-bank-account/${encodeURIComponent(accountReference)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${KORAPAY_SECRET_KEY}`,
      },
    },
  );
  const result: KorapayCreateResponse = await response.json();
  if (!response.ok || !result.status || !result.data) return null;
  return result.data;
}

async function storeAccount(
  userId: string,
  data: {
    account_name: string;
    account_number: string;
    bank_code: string;
    bank_name: string;
    account_reference: string;
    unique_id: string;
    account_status: string;
    currency: string;
  },
): Promise<void> {
  await supabaseClient.from("user_virtual_accounts").upsert(
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
}
