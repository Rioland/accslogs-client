import { NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/billsAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";
import {
  BETTING_MAX_AMOUNT,
  BETTING_MIN_AMOUNT,
  EPINS_MAX_QUANTITY,
  EPINS_MIN_QUANTITY,
  EPINS_NETWORKS,
  EPINS_VALUES,
  EbillsError,
  EbillsProductType,
  extractEpins,
  extractProviderFields,
  isProviderSuccess,
  normalizeBettingServiceId,
  purchaseAirtime,
  purchaseBetting,
  purchaseData,
  purchaseElectricity,
  purchaseEpins,
  purchaseTv,
} from "@/lib/ebills";

export const runtime = "nodejs";

type PayBody = {
  product_type?: EbillsProductType;
  service_id?: string;
  customer_id?: string;
  phone?: string;
  variation_id?: string;
  amount?: number | string;
  /** ePINs only: denomination and how many pins to buy. */
  value?: number | string;
  quantity?: number | string;
};

const SUPPORTED_PRODUCTS: EbillsProductType[] = [
  "airtime",
  "data",
  "electricity",
  "tv",
  "betting",
  "epins",
];

function makeRequestId(userId: string) {
  const short = userId.replace(/-/g, "").slice(0, 12);
  return `bp_${short}_${Date.now()}`.slice(0, 50);
}

export async function POST(req: Request) {
  let requestId: string | null = null;
  let debited = false;

  try {
    const { user, error } = await getAuthedUser(req);
    if (error || !user) return error!;

    const body = (await req.json()) as PayBody;
    const product_type = body.product_type;
    const rawServiceId = String(body.service_id || "").trim();
    const phone = String(body.phone || body.customer_id || "").trim();
    const customer_id = String(body.customer_id || body.phone || "").trim();
    const variation_id = body.variation_id
      ? String(body.variation_id).trim()
      : undefined;
    let amountNum = Number(body.amount);

    if (!product_type || !SUPPORTED_PRODUCTS.includes(product_type)) {
      return NextResponse.json(
        { message: `product_type must be one of: ${SUPPORTED_PRODUCTS.join(", ")}` },
        { status: 400 },
      );
    }
    if (!rawServiceId) {
      return NextResponse.json({ message: "service_id is required" }, { status: 400 });
    }

    // Betting service ids are case-sensitive upstream ("Bet9ja"); everything
    // else expects lowercase. Lowercasing betting here silently 400s.
    let service_id = rawServiceId.toLowerCase();
    if (product_type === "betting") {
      const canonical = normalizeBettingServiceId(rawServiceId);
      if (!canonical) {
        return NextResponse.json(
          { message: `Unsupported betting provider: ${rawServiceId}` },
          { status: 400 },
        );
      }
      service_id = canonical;
    }

    // ePINs are priced as denomination x quantity, so the wallet amount is
    // derived rather than trusted from the client.
    let epinsValue = 0;
    let epinsQuantity = 0;

    if (product_type === "betting") {
      if (!customer_id) {
        return NextResponse.json(
          { message: "customer_id (betting account ID) is required" },
          { status: 400 },
        );
      }
      if (!Number.isFinite(amountNum) || amountNum < BETTING_MIN_AMOUNT || amountNum > BETTING_MAX_AMOUNT) {
        return NextResponse.json(
          {
            message: `Amount must be between ₦${BETTING_MIN_AMOUNT.toLocaleString()} and ₦${BETTING_MAX_AMOUNT.toLocaleString()}`,
          },
          { status: 400 },
        );
      }
    }

    if (product_type === "epins") {
      epinsValue = Number(body.value);
      epinsQuantity = Number(body.quantity);

      if (!(EPINS_NETWORKS as readonly string[]).includes(service_id)) {
        return NextResponse.json(
          { message: `service_id must be one of: ${EPINS_NETWORKS.join(", ")}` },
          { status: 400 },
        );
      }
      if (!(EPINS_VALUES as readonly number[]).includes(epinsValue)) {
        return NextResponse.json(
          { message: `value must be one of: ${EPINS_VALUES.join(", ")}` },
          { status: 400 },
        );
      }
      if (
        !Number.isInteger(epinsQuantity) ||
        epinsQuantity < EPINS_MIN_QUANTITY ||
        epinsQuantity > EPINS_MAX_QUANTITY
      ) {
        return NextResponse.json(
          { message: `quantity must be a whole number between ${EPINS_MIN_QUANTITY} and ${EPINS_MAX_QUANTITY}` },
          { status: 400 },
        );
      }
      amountNum = epinsValue * epinsQuantity;
    }

    if (product_type === "airtime") {
      if (!phone) {
        return NextResponse.json({ message: "phone is required" }, { status: 400 });
      }
      if (!amountNum || amountNum <= 0) {
        return NextResponse.json({ message: "Valid amount is required" }, { status: 400 });
      }
    }

    if (product_type === "data") {
      if (!phone || !variation_id) {
        return NextResponse.json(
          { message: "phone and variation_id are required" },
          { status: 400 },
        );
      }
      if (!amountNum || amountNum <= 0) {
        return NextResponse.json(
          { message: "amount (plan price) is required" },
          { status: 400 },
        );
      }
    }

    if (product_type === "electricity") {
      if (!customer_id || !variation_id) {
        return NextResponse.json(
          { message: "customer_id and variation_id (prepaid/postpaid) are required" },
          { status: 400 },
        );
      }
      if (!amountNum || amountNum <= 0) {
        return NextResponse.json({ message: "Valid amount is required" }, { status: 400 });
      }
    }

    if (product_type === "tv") {
      if (!customer_id || !variation_id) {
        return NextResponse.json(
          { message: "customer_id and variation_id are required" },
          { status: 400 },
        );
      }
      if (!amountNum || amountNum <= 0) {
        return NextResponse.json(
          { message: "amount (package price) is required" },
          { status: 400 },
        );
      }
    }

    const walletAmount = amountNum;
    requestId = makeRequestId(user.id);
    const admin = getSupabaseAdminClient();

    const { data: debitResult, error: debitError } = await admin.rpc(
      "bill_payment_debit",
      {
        p_user_id: user.id,
        p_request_id: requestId,
        p_product_type: product_type,
        p_service_id: service_id,
        p_customer_id:
          product_type === "epins"
            ? null // ePINs are not bought against a customer account
            : product_type === "airtime" || product_type === "data"
              ? phone
              : customer_id,
        p_variation_id:
          product_type === "epins" ? String(epinsValue) : variation_id || null,
        p_amount: walletAmount,
      },
    );

    if (debitError) {
      console.error("[bills/pay] debit rpc", debitError);
      const isBadKey = /invalid api key/i.test(debitError.message || "");
      return NextResponse.json(
        {
          message: isBadKey
            ? "Server misconfigured: set SUPABASE_SERVICE_ROLE_KEY in your Vercel/Netlify project env (use the service_role secret, not the anon key), then redeploy."
            : debitError.message?.includes("function")
              ? "Bill payments are not set up yet. Run `supabase db push` to apply the bill_payments migration."
              : debitError.message || "Failed to debit wallet",
        },
        { status: isBadKey ? 503 : 500 },
      );
    }

    if (!debitResult?.success) {
      return NextResponse.json(
        { message: debitResult?.error || "Failed to debit wallet" },
        { status: debitResult?.error === "Insufficient balance" ? 402 : 400 },
      );
    }

    debited = true;

    let providerPayload: unknown;
    try {
      if (product_type === "airtime") {
        providerPayload = await purchaseAirtime({
          request_id: requestId,
          phone,
          service_id,
          amount: Math.floor(walletAmount),
        });
      } else if (product_type === "data") {
        providerPayload = await purchaseData({
          request_id: requestId,
          phone,
          service_id,
          variation_id: variation_id!,
        });
      } else if (product_type === "electricity") {
        providerPayload = await purchaseElectricity({
          request_id: requestId,
          customer_id,
          service_id,
          variation_id: variation_id!,
          amount: Math.floor(walletAmount),
        });
      } else if (product_type === "betting") {
        providerPayload = await purchaseBetting({
          request_id: requestId,
          customer_id,
          service_id,
          amount: Math.floor(walletAmount),
        });
      } else if (product_type === "epins") {
        providerPayload = await purchaseEpins({
          request_id: requestId,
          service_id,
          value: epinsValue,
          quantity: epinsQuantity,
        });
      } else {
        providerPayload = await purchaseTv({
          request_id: requestId,
          customer_id,
          service_id,
          variation_id: variation_id!,
          amount: Math.floor(walletAmount),
        });
      }
    } catch (providerErr) {
      const message =
        providerErr instanceof EbillsError
          ? providerErr.message
          : "Provider request failed";
      const payload =
        providerErr instanceof EbillsError ? providerErr.payload : null;

      await admin.rpc("bill_payment_fail_and_refund", {
        p_request_id: requestId,
        p_error_message: message,
        p_provider_response: payload,
      });

      return NextResponse.json(
        { message, code: providerErr instanceof EbillsError ? providerErr.code : undefined },
        {
          status:
            providerErr instanceof EbillsError &&
            providerErr.status >= 400 &&
            providerErr.status < 600
              ? providerErr.status
              : 502,
        },
      );
    }

    if (!isProviderSuccess(providerPayload)) {
      const message =
        (providerPayload as { message?: string })?.message ||
        "Provider did not confirm success";
      await admin.rpc("bill_payment_fail_and_refund", {
        p_request_id: requestId,
        p_error_message: message,
        p_provider_response: providerPayload,
      });
      return NextResponse.json({ message, data: providerPayload }, { status: 502 });
    }

    const fields = extractProviderFields(providerPayload);
    await admin.rpc("bill_payment_complete", {
      p_request_id: requestId,
      p_provider_order_id: fields.provider_order_id,
      p_amount_charged: fields.amount_charged,
      p_discount: fields.discount,
      p_provider_token: fields.provider_token,
      p_provider_units: fields.provider_units,
      p_provider_response: providerPayload,
    });

    const epins = product_type === "epins" ? extractEpins(providerPayload) : [];

    return NextResponse.json({
      success: true,
      request_id: requestId,
      bill_payment_id: debitResult.id,
      new_balance: debitResult.new_balance,
      provider: providerPayload,
      token: fields.provider_token,
      units: fields.provider_units,
      // Empty while the order is still processing-api; requery to collect them.
      epins,
      epins_pending: product_type === "epins" && epins.length === 0,
    });
  } catch (err) {
    console.error("[bills/pay]", err);

    if (debited && requestId) {
      try {
        const admin = getSupabaseAdminClient();
        await admin.rpc("bill_payment_fail_and_refund", {
          p_request_id: requestId,
          p_error_message: err instanceof Error ? err.message : "Unexpected error",
          p_provider_response: null,
        });
      } catch (refundErr) {
        console.error("[bills/pay] refund failed", refundErr);
      }
    }

    if (err instanceof EbillsError) {
      return NextResponse.json(
        { message: err.message, code: err.code },
        { status: err.status >= 400 && err.status < 600 ? err.status : 502 },
      );
    }

    return NextResponse.json({ message: "Payment failed" }, { status: 500 });
  }
}
