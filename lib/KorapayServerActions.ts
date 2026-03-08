/* eslint-disable @typescript-eslint/no-explicit-any */

import supabaseClient from "./supabaseClient";

const KORAPAY_SECRET_KEY = process.env.KORAPAY_SECRET_KEY|| "sk_test_607a708e8c579fe41abce93305b8b666d16f3cd7"!;
const KORAPAY_BASE_URL =
  process.env.NEXT_PUBLIC_KORAPAY_BASE_URL ??"https://api.korapay.com/merchant/api/v1";

export type KorapayDedicatedAccount = {
  accountNumber: string;
  accountBank: string;
  accountName: string;
};

export async function generateKorapayDedicatedAccount(
  id: string,
): Promise<KorapayDedicatedAccount> {
  "use client";

  const { data: profile, error: profileError } = await supabaseClient

    .from("profiles")
    .select(
      "korapay_customer_id, id, first_name, last_name",
    )
    .eq("id", id)
    .single();

  if (profileError || !profile) {
    throw new Error("Profile not found");
  }

 
  let korapayId = profile.korapay_customer_id;
  let accountReference=id;
  console.log(KORAPAY_SECRET_KEY, KORAPAY_BASE_URL);
  if (!korapayId) {
    const response = await fetch(`${KORAPAY_BASE_URL}/virtual-bank-account`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KORAPAY_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        account_reference: id,
        account_name: `${profile.first_name} ${profile.last_name}`,
        permanent: true,
        bank_code: "035",
        customer: {
          name: `${profile.first_name} ${profile.last_name}`,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error("Failed to create customer");
    }

    korapayId = data.data.unique_id;
    accountReference = data.data.account_reference;

    await supabaseClient

      .from("profiles")
      .update({ korapay_customer_id: korapayId, account_reference: accountReference })
      .eq("id", id);
  }

  const response = await fetch(`${KORAPAY_BASE_URL}/virtual-bank-account/${accountReference}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KORAPAY_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error("Failed to create dedicated account");
  }

  const { account_number, account_name, bank_name } = data.data;



  return {
    accountNumber: account_number,
    accountBank: bank_name,
    accountName: account_name,
  };
}
