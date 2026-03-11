import { NextResponse } from "next/server";

const KORAPAY_SECRET_KEY =
  process.env.KORAPAY_SECRET_KEY || process.env.KORAPAY_WEBHOOK_SECRET || "";

const KORAPAY_BASE_URL =
  process.env.NEXT_PUBLIC_KORAPAY_BASE_URL ??
  "https://api.korapay.com/merchant/api/v1";

// To avoid guessing the exact path, read it from env based on your
// "Pay with bank transfer" API docs, e.g. "/bank-transfers".
const KORAPAY_BANK_TRANSFER_PATH = process.env.KORAPAY_BANK_TRANSFER_PATH;

if (!KORAPAY_BANK_TRANSFER_PATH) {
  // eslint-disable-next-line no-console
  console.warn(
    "KORAPAY_BANK_TRANSFER_PATH is not set; configure it based on the Pay with Bank Transfer API endpoint.",
  );
}

export async function POST(req: Request) {
  if (!KORAPAY_SECRET_KEY || !KORAPAY_BANK_TRANSFER_PATH) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "Korapay bank transfer is not configured. Please set KORAPAY_SECRET_KEY and KORAPAY_BANK_TRANSFER_PATH.",
      },
      { status: 500 },
    );
  }

  try {
    const body = await req.json();
    const { amount, reference, userId, email, name } = body as {
      amount: number;
      reference: string;
      userId: string;
      email: string;
      name?: string;
    };

    if (!amount || amount <= 0 || !reference || !userId || !email) {
      return NextResponse.json(
        {
          status: "error",
          message: "Missing or invalid amount, reference, userId or email.",
        },
        { status: 400 },
      );
    }

    const payload = {
      reference,
      amount,
      currency: "NGN",
      customer: {
        name: name || email,
        email,
      },
      // We rely on your global Korapay webhook URL for notifications.
      metadata: {
        userId,
        source: "bank_transfer_dynamic",
      },
    };

    const response = await fetch(
      `${KORAPAY_BASE_URL}${KORAPAY_BANK_TRANSFER_PATH}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${KORAPAY_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    const json = await response.json();

    if (!response.ok || !json?.status) {
      return NextResponse.json(
        {
          status: "error",
          message: json?.message || "Failed to initiate bank transfer",
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

