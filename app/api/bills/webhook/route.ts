import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";
import {
  EbillsWebhookPayload,
  extractProviderFields,
  isProviderRefunded,
  requeryOrder,
  verifyEbillsWebhookSignature,
} from "@/lib/ebills";

export const runtime = "nodejs";
// The signature covers the raw bytes, so this must never be cached or pre-parsed.
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // Read the body as text FIRST — re-serialising parsed JSON changes the bytes
  // and the HMAC will never match.
  const rawBody = await req.text();
  const signature =
    req.headers.get("x-signature") ?? req.headers.get("X-Signature");

  if (!verifyEbillsWebhookSignature(rawBody, signature)) {
    console.warn("[bills/webhook] rejected: bad or missing X-Signature");
    return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
  }

  let payload: EbillsWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as EbillsWebhookPayload;
  } catch {
    return NextResponse.json({ message: "Malformed payload" }, { status: 400 });
  }

  const requestId = String(payload.request_id || "").trim();
  const orderId = payload.order_id != null ? String(payload.order_id) : null;
  const status = String(payload.status || "").trim().toLowerCase();

  if (!requestId || !status) {
    return NextResponse.json(
      { message: "Missing request_id or status" },
      { status: 400 },
    );
  }

  const admin = getSupabaseAdminClient();

  // eBills sends no idempotency key, so the natural key is the transition being
  // reported. A duplicate means we already handled it.
  const eventKey = `${orderId ?? requestId}:${status}`;
  const { error: claimError } = await admin.from("bill_webhook_events").insert({
    event_key: eventKey,
    order_id: orderId,
    request_id: requestId,
    status,
    payload: payload as unknown as Record<string, unknown>,
  });

  if (claimError) {
    if (claimError.code === "23505") {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    console.error("[bills/webhook] could not record event", claimError);
    return NextResponse.json({ message: "Storage error" }, { status: 500 });
  }

  const { data: row } = await admin
    .from("bill_payments")
    .select("id, request_id, status, amount")
    .eq("request_id", requestId)
    .maybeSingle();

  if (!row) {
    // Stored above for audit; nothing to update. Ack so eBills stops retrying.
    console.warn(`[bills/webhook] no bill_payment for request_id=${requestId}`);
    return NextResponse.json({ ok: true, unmatched: true });
  }

  try {
    /* ------------------------------ completed ------------------------------ */
    if (status === "completed-api" || status === "completed") {
      if (row.status === "refunded" || row.status === "failed") {
        // We refunded (usually because the original call timed out) but the
        // order actually went through. The customer has both the money and the
        // service; only a human can decide how to settle that.
        console.error(
          `[bills/webhook] RECONCILE: ${requestId} was ${row.status} locally but eBills reports ${status}`,
        );
        await admin.rpc("bill_payment_flag_reconciliation", {
          p_request_id: requestId,
          p_note: `eBills reported ${status} after local ${row.status}. Order ${orderId}.`,
        });
        return NextResponse.json({ ok: true, reconciliation: true });
      }

      const fields = extractProviderFields({ data: payload });
      await admin.rpc("bill_payment_complete", {
        p_request_id: requestId,
        p_provider_order_id: orderId,
        p_amount_charged: fields.amount_charged,
        p_discount: fields.discount,
        p_provider_token: fields.provider_token,
        p_provider_units: fields.provider_units,
        p_provider_response: payload as unknown as Record<string, unknown>,
      });
      return NextResponse.json({ ok: true, applied: "completed" });
    }

    /* ------------------------------- refunded ------------------------------ */
    if (status === "refunded") {
      // Refunding credits real money back to the wallet, and the webhook secret
      // is only a 4-digit PIN. Confirm against the API before paying out, so a
      // forged notification cannot mint refunds.
      let confirmed = false;
      try {
        confirmed = isProviderRefunded(await requeryOrder(requestId));
      } catch (err) {
        console.error("[bills/webhook] requery failed for", requestId, err);
      }

      if (!confirmed) {
        console.error(
          `[bills/webhook] refused refund for ${requestId}: requery did not confirm a refund`,
        );
        await admin.rpc("bill_payment_flag_reconciliation", {
          p_request_id: requestId,
          p_note: `Refund webhook received but requery did not confirm. Order ${orderId}.`,
        });
        return NextResponse.json({ ok: true, refund: "unconfirmed" });
      }

      await admin.rpc("bill_payment_fail_and_refund", {
        p_request_id: requestId,
        p_error_message: "Refunded by provider",
        p_provider_response: payload as unknown as Record<string, unknown>,
      });
      return NextResponse.json({ ok: true, applied: "refunded" });
    }

    // Any other status is recorded for audit only.
    return NextResponse.json({ ok: true, stored: true });
  } catch (err) {
    console.error("[bills/webhook] handler failed", err);
    return NextResponse.json({ message: "Handler error" }, { status: 500 });
  }
}
