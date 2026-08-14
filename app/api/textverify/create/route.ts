import { NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/billsAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";
import {
  TextVerifiedError,
  TvCapability,
  createVerification,
  extractPhone,
  getAccountDetails,
  getVerificationInventory,
  getVerificationPricing,
  usdToNgn,
} from "@/lib/textverified";

// smsAndVoiceCombo is intentionally excluded: the provider 400s it for most
// services, so accepting it here only buys a wasted upstream round trip.
const ALLOWED_CAPABILITIES = ["sms", "voice"] as const;

export const runtime = "nodejs";

function makeRequestId(userId: string) {
  const short = userId.replace(/-/g, "").slice(0, 12);
  return `tv_${short}_${Date.now()}`.slice(0, 50);
}

export async function POST(req: Request) {
  let requestId: string | null = null;
  let debited = false;

  try {
    const { user, error } = await getAuthedUser(req);
    if (error || !user) return error!;

    const body = (await req.json()) as {
      serviceName?: string;
      capability?: string;
      areaCodes?: string[];
    };
    const serviceName = String(body.serviceName || "").trim();
    const capability = String(body.capability || "sms").trim() || "sms";
    const areaCodes = Array.isArray(body.areaCodes)
      ? body.areaCodes.map((c) => String(c).trim()).filter(Boolean).slice(0, 5)
      : [];

    if (!serviceName) {
      return NextResponse.json({ message: "serviceName is required" }, { status: 400 });
    }
    if (!(ALLOWED_CAPABILITIES as readonly string[]).includes(capability)) {
      return NextResponse.json(
        { message: `capability must be one of: ${ALLOWED_CAPABILITIES.join(", ")}` },
        { status: 400 },
      );
    }

    const { usd } = await getVerificationPricing({
      serviceName,
      capability,
      areaCode: areaCodes.length > 0,
    });
    if (!usd || usd <= 0) {
      return NextResponse.json(
        { message: "This service is unavailable or has no price right now" },
        { status: 404 },
      );
    }

    // Preflight BEFORE debiting: an out-of-stock service or an exhausted
    // provider balance would otherwise debit the customer, fail upstream and
    // refund — visible to them as a failed payment.
    const [inventory, account] = await Promise.all([
      getVerificationInventory({
        serviceName,
        capability: capability as TvCapability,
      }).catch(() => null),
      getAccountDetails().catch(() => null),
    ]);

    if (inventory !== null && inventory <= 0) {
      return NextResponse.json(
        { message: "No numbers are available for this service right now. Try another service.", code: "out_of_stock" },
        { status: 409 },
      );
    }

    if (account !== null && account.balance < usd) {
      console.error(
        `[textverify/create] provider balance $${account.balance} < $${usd} required — top up TextVerified`,
      );
      return NextResponse.json(
        { message: "This service is temporarily unavailable. Please try again later.", code: "provider_balance_low" },
        { status: 503 },
      );
    }

    const amountNgn = usdToNgn(usd);
    requestId = makeRequestId(user.id);
    const admin = getSupabaseAdminClient();

    const { data: debitResult, error: debitError } = await admin.rpc(
      "text_verification_debit",
      {
        p_user_id: user.id,
        p_request_id: requestId,
        p_service_name: serviceName,
        p_capability: capability,
        p_amount_usd: usd,
        p_amount_ngn: amountNgn,
      },
    );

    if (debitError) {
      console.error("[textverify/create] debit", debitError);
      const isBadKey = /invalid api key/i.test(debitError.message || "");
      return NextResponse.json(
        {
          message: isBadKey
            ? "Server misconfigured: set SUPABASE_SERVICE_ROLE_KEY and redeploy."
            : debitError.message?.includes("function")
              ? "Text verify is not set up yet. Run `supabase db push` for the text_verifications migration."
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

    let verification;
    try {
      verification = await createVerification({
        serviceName,
        capability,
        maxPrice: usd * 1.05,
        areaCodes,
      });
    } catch (providerErr) {
      const message =
        providerErr instanceof TextVerifiedError
          ? providerErr.message
          : "Provider request failed";
      const payload =
        providerErr instanceof TextVerifiedError ? providerErr.payload : null;

      await admin.rpc("text_verification_fail_and_refund", {
        p_request_id: requestId,
        p_error_message: message,
        p_provider_response: payload,
      });

      return NextResponse.json(
        {
          message,
          code:
            providerErr instanceof TextVerifiedError
              ? providerErr.code
              : undefined,
        },
        {
          status:
            providerErr instanceof TextVerifiedError &&
            providerErr.status >= 400 &&
            providerErr.status < 600
              ? providerErr.status
              : 502,
        },
      );
    }

    const phone = extractPhone(verification);
    const providerId = String(verification.id || "");
    if (!providerId || !phone) {
      await admin.rpc("text_verification_fail_and_refund", {
        p_request_id: requestId,
        p_error_message: "Provider did not return a phone number",
        p_provider_response: verification,
      });
      return NextResponse.json(
        { message: "Provider did not return a phone number" },
        { status: 502 },
      );
    }

    const endsAt = verification.endsAt || verification.ends_at || null;

    await admin.rpc("text_verification_activate", {
      p_request_id: requestId,
      p_provider_id: providerId,
      p_phone_number: phone,
      p_ends_at: endsAt,
      p_provider_response: verification,
    });

    return NextResponse.json({
      success: true,
      id: debitResult.id,
      request_id: requestId,
      provider_id: providerId,
      service_name: serviceName,
      phone_number: phone,
      amount_ngn: amountNgn,
      new_balance: debitResult.new_balance,
      ends_at: endsAt,
    });
  } catch (err) {
    console.error("[textverify/create]", err);

    if (debited && requestId) {
      try {
        const admin = getSupabaseAdminClient();
        await admin.rpc("text_verification_fail_and_refund", {
          p_request_id: requestId,
          p_error_message: err instanceof Error ? err.message : "Unexpected error",
          p_provider_response: null,
        });
      } catch (refundErr) {
        console.error("[textverify/create] refund failed", refundErr);
      }
    }

    if (err instanceof TextVerifiedError) {
      return NextResponse.json(
        { message: err.message, code: err.code },
        { status: err.status >= 400 && err.status < 600 ? err.status : 502 },
      );
    }

    return NextResponse.json({ message: "Failed to create verification" }, { status: 500 });
  }
}
