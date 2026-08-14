import { NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/billsAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";
import {
  EbillsError,
  extractEpins,
  extractProviderFields,
  isProviderCompleted,
  requeryOrder,
} from "@/lib/ebills";

export const runtime = "nodejs";

/**
 * Re-fetch an order from eBills and store whatever it now yields.
 *
 * eBills frequently returns "processing-api" at purchase time with the token or
 * PINs still null, and only fills them in moments later. Without this the
 * customer has paid and can never retrieve what they bought.
 */
export async function POST(req: Request) {
  try {
    const { user, error } = await getAuthedUser(req);
    if (error || !user) return error!;

    const body = (await req.json()) as { request_id?: string };
    const requestId = String(body.request_id || "").trim();
    if (!requestId) {
      return NextResponse.json(
        { message: "request_id is required" },
        { status: 400 },
      );
    }

    const admin = getSupabaseAdminClient();

    // Scoped to the caller so one user cannot requery another's order.
    const { data: row } = await admin
      .from("bill_payments")
      .select("id, request_id, status, product_type, provider_token, provider_response")
      .eq("user_id", user.id)
      .eq("request_id", requestId)
      .maybeSingle();

    if (!row) {
      return NextResponse.json({ message: "Payment not found" }, { status: 404 });
    }

    const payload = await requeryOrder(requestId);
    const fields = extractProviderFields(payload);
    const epins = extractEpins(payload);
    const completed = isProviderCompleted(payload);

    // Only mark complete once the provider agrees, otherwise a still-processing
    // order would be frozen in a completed state with nothing to show.
    if (completed && (row.status === "processing" || row.status === "pending")) {
      await admin.rpc("bill_payment_complete", {
        p_request_id: requestId,
        p_provider_order_id: fields.provider_order_id,
        p_amount_charged: fields.amount_charged,
        p_discount: fields.discount,
        p_provider_token: fields.provider_token,
        p_provider_units: fields.provider_units,
        p_provider_response: payload as Record<string, unknown>,
      });
    } else if (fields.provider_token || epins.length > 0) {
      // Already marked complete locally but the deliverable arrived later.
      await admin
        .from("bill_payments")
        .update({
          provider_token: fields.provider_token ?? row.provider_token,
          provider_units: fields.provider_units,
          provider_order_id: fields.provider_order_id,
          provider_response: payload as Record<string, unknown>,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
    }

    return NextResponse.json({
      success: true,
      status: fields.status,
      completed,
      token: fields.provider_token,
      units: fields.provider_units,
      epins: epins.map((p) => ({
        amount: p.amount ?? null,
        pin: p.pin ?? null,
        serial: p.serial ?? null,
        instruction: p.instruction ?? null,
      })),
    });
  } catch (err) {
    if (err instanceof EbillsError) {
      return NextResponse.json(
        { message: err.message, code: err.code },
        { status: err.status >= 400 && err.status < 600 ? err.status : 502 },
      );
    }
    console.error("[bills/requery]", err);
    return NextResponse.json({ message: "Could not refresh order" }, { status: 500 });
  }
}
