import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";
import {
  TvSmsWebhookData,
  TvWebhookEnvelope,
  verifyWebhookSignature,
} from "@/lib/textverified";

export const runtime = "nodejs";
// Signature is computed over the raw bytes, so this must never be cached or
// pre-parsed by the framework.
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // Read the body as text FIRST — re-serialising parsed JSON produces a
  // different byte sequence and the HMAC will never match.
  const rawBody = await req.text();
  const signature = req.headers.get("x-webhook-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    console.warn("[textverify/webhook] rejected: bad or missing signature");
    return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
  }

  let envelope: TvWebhookEnvelope<unknown>;
  try {
    envelope = JSON.parse(rawBody) as TvWebhookEnvelope<unknown>;
  } catch {
    return NextResponse.json({ message: "Malformed payload" }, { status: 400 });
  }

  const { event, idempotencyKey } = envelope;
  if (!event || !idempotencyKey) {
    return NextResponse.json({ message: "Missing event or idempotencyKey" }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  const reservationId =
    (envelope.data as { reservationId?: string } | null)?.reservationId ??
    (envelope.data as { id?: string } | null)?.id ??
    null;

  // Claim the event. TextVerified retries with exponential backoff, so a
  // duplicate primary key means we already handled this and can ack silently.
  const { error: claimError } = await admin
    .from("text_webhook_events")
    .insert({
      idempotency_key: idempotencyKey,
      event,
      reservation_id: reservationId,
      payload: envelope as unknown as Record<string, unknown>,
    });

  if (claimError) {
    if (claimError.code === "23505") {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    console.error("[textverify/webhook] could not record event", claimError);
    // 500 so TextVerified retries rather than dropping the event.
    return NextResponse.json({ message: "Storage error" }, { status: 500 });
  }

  try {
    if (event === "v2.sms.received") {
      const sms = envelope.data as TvSmsWebhookData;
      if (!sms?.reservationId) {
        return NextResponse.json({ ok: true, ignored: "no reservationId" });
      }

      // A reservation is either a verification or a rental; try the
      // verification first, then fall back to recording against the rental.
      const { data: completed } = await admin.rpc(
        "text_verification_complete_by_provider",
        {
          p_provider_id: sms.reservationId,
          p_sms_code: sms.parsedCode,
          p_sms_content: sms.smsContent,
          p_provider_response: sms as unknown as Record<string, unknown>,
        },
      );

      if (!completed?.success) {
        await admin.rpc("text_rental_record_sms", {
          p_provider_id: sms.reservationId,
          p_provider_response: sms as unknown as Record<string, unknown>,
        });
      }

      return NextResponse.json({ ok: true });
    }

    // Other subscribed events are stored for audit but need no state change yet.
    return NextResponse.json({ ok: true, stored: true });
  } catch (err) {
    console.error("[textverify/webhook] handler failed", err);
    return NextResponse.json({ message: "Handler error" }, { status: 500 });
  }
}
