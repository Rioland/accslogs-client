import { NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/billsAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";
import {
  TextVerifiedError,
  extractPhone,
  getVerificationPricing,
  reactivateVerification,
  reportVerification,
  reuseVerification,
  usdToNgn,
} from "@/lib/textverified";

export const runtime = "nodejs";

type Action = "reuse" | "reactivate" | "report";
const ACTIONS: Action[] = ["reuse", "reactivate", "report"];

function makeRequestId(userId: string) {
  const short = userId.replace(/-/g, "").slice(0, 12);
  return `tv_${short}_${Date.now()}`.slice(0, 50);
}

export async function POST(req: Request) {
  try {
    const { user, error } = await getAuthedUser(req);
    if (error || !user) return error!;

    const body = (await req.json()) as { request_id?: string; action?: Action };
    const action = body.action as Action;
    const requestId = String(body.request_id || "").trim();

    if (!ACTIONS.includes(action)) {
      return NextResponse.json(
        { message: `action must be one of: ${ACTIONS.join(", ")}` },
        { status: 400 },
      );
    }
    if (!requestId) {
      return NextResponse.json({ message: "request_id is required" }, { status: 400 });
    }

    const admin = getSupabaseAdminClient();
    const { data: row } = await admin
      .from("text_verifications")
      .select("id, user_id, provider_id, service_name, capability, status")
      .eq("user_id", user.id)
      .eq("request_id", requestId)
      .maybeSingle();

    if (!row?.provider_id) {
      return NextResponse.json({ message: "Verification not found" }, { status: 404 });
    }

    /* ---------------- report: free, no new number ---------------- */
    if (action === "report") {
      await reportVerification(row.provider_id);
      await admin
        .from("text_verifications")
        .update({ reported_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", row.id);
      return NextResponse.json({
        success: true,
        action,
        message: "Reported to the provider. Their support team will review it.",
      });
    }

    /* ------------- reuse / reactivate: mints a new charged line ------------- */

    // Worst-case price, used only as an affordability pre-check. The real
    // charge is whatever the provider reports once the line exists, so a
    // cheaper reuse is not overcharged.
    const { usd: listUsd } = await getVerificationPricing({
      serviceName: row.service_name,
      capability: row.capability || "sms",
    });
    const worstCaseNgn = usdToNgn(listUsd);

    const { data: profile } = await admin
      .from("profiles")
      .select("funds")
      .eq("id", user.id)
      .maybeSingle();

    if (Number(profile?.funds ?? 0) < worstCaseNgn) {
      return NextResponse.json(
        { message: "Insufficient balance", required_ngn: worstCaseNgn },
        { status: 402 },
      );
    }

    const verification =
      action === "reuse"
        ? await reuseVerification(row.provider_id)
        : await reactivateVerification(row.provider_id);

    const phone = extractPhone(verification);
    const newProviderId = String(verification.id || "");
    if (!newProviderId || !phone) {
      return NextResponse.json(
        { message: "Provider did not return a usable number" },
        { status: 502 },
      );
    }

    // Charge what it actually cost; fall back to list price if absent.
    const actualUsd = Number(verification.totalCost ?? listUsd) || listUsd;
    const amountNgn = usdToNgn(actualUsd);
    const newRequestId = makeRequestId(user.id);

    const { data: debitResult, error: debitError } = await admin.rpc(
      "text_verification_debit_child",
      {
        p_user_id: user.id,
        p_request_id: newRequestId,
        p_parent_id: row.id,
        p_service_name: row.service_name,
        p_capability: row.capability || "sms",
        p_amount_usd: actualUsd,
        p_amount_ngn: amountNgn,
      },
    );

    if (debitError || !debitResult?.success) {
      // The line exists upstream but we failed to bill for it. Do NOT hand the
      // number over silently — log loudly so it can be reconciled.
      console.error(
        `[textverify/recover] ${action} succeeded upstream (provider_id=${newProviderId}) but debit failed:`,
        debitError?.message || debitResult?.error,
      );
      return NextResponse.json(
        { message: debitResult?.error || "Could not complete billing for this number" },
        { status: debitResult?.error === "Insufficient balance" ? 402 : 500 },
      );
    }

    await admin.rpc("text_verification_activate", {
      p_request_id: newRequestId,
      p_provider_id: newProviderId,
      p_phone_number: phone,
      p_ends_at: verification.endsAt || null,
      p_provider_response: verification,
    });

    return NextResponse.json({
      success: true,
      action,
      request_id: newRequestId,
      provider_id: newProviderId,
      phone_number: phone,
      service_name: row.service_name,
      amount_ngn: amountNgn,
      new_balance: debitResult.new_balance,
      ends_at: verification.endsAt || null,
    });
  } catch (err) {
    if (err instanceof TextVerifiedError) {
      return NextResponse.json(
        { message: err.message, code: err.code },
        { status: err.status >= 400 && err.status < 600 ? err.status : 502 },
      );
    }
    console.error("[textverify/recover]", err);
    return NextResponse.json({ message: "Recovery action failed" }, { status: 500 });
  }
}
