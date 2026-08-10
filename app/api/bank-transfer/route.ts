import { NextResponse } from "next/server";

import { getAuthedUser } from "@/lib/billsAuth";
import { KORAPAY_BASE_URL, getKorapaySecretKey } from "@/lib/korapayServer";

export const runtime = "nodejs";

// Static path from Korapay docs: /charges/bank-transfer
const KORAPAY_BANK_TRANSFER_PATH = "/charges/bank-transfer";

export async function POST(req: Request) {
  // The userId below ends up in Korapay metadata, which the webhook trusts to
  // decide whose wallet to credit — so it must come from a verified token, not
  // the request body.
  const { user, error: authError } = await getAuthedUser(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { amount, reference, email, name } = body as {
      amount: number;
      reference: string;
      email?: string;
      name?: string;
    };

    const customerEmail = email || user.email;

    if (!amount || amount <= 0 || !reference || !customerEmail) {
      return NextResponse.json(
        {
          status: "error",
          message: "Missing or invalid amount, reference or email.",
        },
        { status: 400 },
      );
    }

    const payload = {
      reference,
      amount,
      currency: "NGN",
      account_name: name || customerEmail,
      customer: {
        name: name || customerEmail,
        email: customerEmail,
      },
      // We rely on your global Korapay webhook URL for notifications.
      metadata: {
        userId: user.id,
        source: "bank_transfer_dynamic",
      },
    };

    const response = await fetch(
      `${KORAPAY_BASE_URL}${KORAPAY_BANK_TRANSFER_PATH}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getKorapaySecretKey()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    const json = await response.json();

    if (!response.ok || !json?.status) {
      // eslint-disable-next-line no-console
      console.error("Korapay bank-transfer error response:", json);
      return NextResponse.json(
        {
          status: "error",
          message:
            json?.message ||
            json?.errors?.[0]?.message ||
            "Failed to initiate bank transfer",
        },
        { status: 500 },
      );
    }

    const data = json.data || {};

    return NextResponse.json({
      status: "success",
      reference: data.reference ?? reference,
      bankAccount: data.bank_account,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Bank transfer API error:", error);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 },
    );
  }
}

