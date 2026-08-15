import { NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/billsAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";
import {
  TextVerifiedError,
  createRental,
  extractPhone,
  getRentalPricing,
  RentalDurationApi,
  usdToNgn,
} from "@/lib/textverified";

export const runtime = "nodejs";

function makeRequestId(userId: string) {
  const short = userId.replace(/-/g, "").slice(0, 12);
  return `tr_${short}_${Date.now()}`.slice(0, 50);
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
      isRenewable?: boolean;
      duration?: RentalDurationApi;
      alwaysOn?: boolean;
    };

    const serviceName = String(body.serviceName || "allservices").trim();
    const capability = String(body.capability || "sms").trim() || "sms";
    const isRenewable = Boolean(body.isRenewable);
    const duration = (body.duration ||
      (isRenewable ? "thirtyDay" : "sevenDay")) as RentalDurationApi;
    const alwaysOn = body.alwaysOn ?? true;

    if (isRenewable && !["thirtyDay", "ninetyDay", "oneYear"].includes(duration)) {
      return NextResponse.json(
        { message: "Renewable rentals require 30 days, 90 days, or 1 year" },
        { status: 400 },
      );
    }

    // oneDay is excluded: the provider does not sell a 1-day "allservices"
    // rental, so it is not offered anywhere in the UI.
    if (
      !isRenewable &&
      !["threeDay", "sevenDay", "fourteenDay"].includes(duration)
    ) {
      return NextResponse.json(
        { message: "Non-renewable rentals support 3, 7 or 14 day durations" },
        { status: 400 },
      );
    }

    const { usd } = await getRentalPricing({
      serviceName,
      capability,
      isRenewable,
      duration,
      alwaysOn,
    });

    if (!usd || usd <= 0) {
      return NextResponse.json(
        { message: "This rental is unavailable or has no price right now" },
        { status: 404 },
      );
    }

    const amountNgn = usdToNgn(usd);
    requestId = makeRequestId(user.id);
    const admin = getSupabaseAdminClient();

    const { data: debitResult, error: debitError } = await admin.rpc(
      "text_rental_debit",
      {
        p_user_id: user.id,
        p_request_id: requestId,
        p_service_name: serviceName,
        p_capability: capability,
        p_is_renewable: isRenewable,
        p_duration: duration,
        p_always_on: alwaysOn,
        p_amount_usd: usd,
        p_amount_ngn: amountNgn,
      },
    );

    if (debitError) {
      console.error("[textverify/rental/create] debit", debitError);
      const isBadKey = /invalid api key/i.test(debitError.message || "");
      return NextResponse.json(
        {
          message: isBadKey
            ? "Server misconfigured: set SUPABASE_SERVICE_ROLE_KEY and redeploy."
            : debitError.message?.includes("function")
              ? "Rentals are not set up yet. Run `supabase db push` for the text_rentals migration."
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

    let rental;
    try {
      rental = await createRental({
        serviceName,
        capability,
        isRenewable,
        duration,
        alwaysOn,
        allowBackOrder: false,
      });
    } catch (providerErr) {
      const message =
        providerErr instanceof TextVerifiedError
          ? providerErr.message
          : "Provider request failed";
      const payload =
        providerErr instanceof TextVerifiedError ? providerErr.payload : null;

      await admin.rpc("text_rental_fail_and_refund", {
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

    const phone = extractPhone(rental as Parameters<typeof extractPhone>[0]);
    const providerId = String(rental.id || "");
    if (!providerId || !phone) {
      await admin.rpc("text_rental_fail_and_refund", {
        p_request_id: requestId,
        p_error_message: "Provider did not return a phone number",
        p_provider_response: rental,
      });
      return NextResponse.json(
        { message: "Provider did not return a phone number" },
        { status: 502 },
      );
    }

    const endsAt =
      rental.endsAt ||
      (rental as { ends_at?: string }).ends_at ||
      null;

    await admin.rpc("text_rental_activate", {
      p_request_id: requestId,
      p_provider_id: providerId,
      p_phone_number: phone,
      p_ends_at: endsAt,
      p_provider_response: rental,
    });

    return NextResponse.json({
      success: true,
      id: debitResult.id,
      request_id: requestId,
      provider_id: providerId,
      service_name: serviceName,
      phone_number: phone,
      is_renewable: isRenewable,
      duration,
      amount_ngn: amountNgn,
      new_balance: debitResult.new_balance,
      ends_at: endsAt,
    });
  } catch (err) {
    console.error("[textverify/rental/create]", err);

    if (debited && requestId) {
      try {
        const admin = getSupabaseAdminClient();
        await admin.rpc("text_rental_fail_and_refund", {
          p_request_id: requestId,
          p_error_message: err instanceof Error ? err.message : "Unexpected error",
          p_provider_response: null,
        });
      } catch (refundErr) {
        console.error("[textverify/rental/create] refund failed", refundErr);
      }
    }

    if (err instanceof TextVerifiedError) {
      return NextResponse.json(
        { message: err.message, code: err.code },
        { status: err.status >= 400 && err.status < 600 ? err.status : 502 },
      );
    }

    return NextResponse.json({ message: "Failed to create rental" }, { status: 500 });
  }
}
