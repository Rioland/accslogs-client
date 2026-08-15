import { NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/billsAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";
import {
  TextVerifiedError,
  extractSmsFields,
  listSms,
} from "@/lib/textverified";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { user, error } = await getAuthedUser(req);
    if (error || !user) return error!;

    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get("request_id");
    const id = searchParams.get("id");

    if (!requestId && !id) {
      return NextResponse.json(
        { message: "request_id or id is required" },
        { status: 400 },
      );
    }

    const admin = getSupabaseAdminClient();
    let query = admin
      .from("text_rentals")
      .select(
        "id, user_id, request_id, provider_id, service_name, phone_number, is_renewable, duration, amount_ngn, status, ends_at, created_at",
      )
      .eq("user_id", user.id);

    if (requestId) query = query.eq("request_id", requestId);
    else query = query.eq("id", Number(id));

    const { data: row, error: rowError } = await query.maybeSingle();
    if (rowError || !row) {
      return NextResponse.json({ message: "Rental not found" }, { status: 404 });
    }

    // Everything we have already stored, regardless of rental state — an
    // expired rental's messages are still the customer's to read.
    const readStored = async () => {
      const { data } = await admin
        .from("text_rental_messages")
        .select("id, from_number, sms_content, parsed_code, received_at")
        .eq("rental_id", row.id)
        .order("received_at", { ascending: false })
        .limit(200);
      return data || [];
    };

    if (row.status !== "active" || !row.phone_number) {
      return NextResponse.json({ rental: row, messages: await readStored() });
    }

    if (row.ends_at && new Date(row.ends_at).getTime() < Date.now()) {
      await admin
        .from("text_rentals")
        .update({ status: "expired", updated_at: new Date().toISOString() })
        .eq("id", row.id)
        .eq("status", "active");
      return NextResponse.json({
        rental: { ...row, status: "expired" },
        messages: await readStored(),
      });
    }

    // Poll the provider and persist anything new. This is the fallback path —
    // the webhook is what delivers in real time — so it must be idempotent
    // against messages the webhook already stored.
    const fetched = await listSms({
      to: row.phone_number,
      reservationId: row.provider_id || undefined,
    }).catch((err) => {
      console.warn("[textverify/rental/sms] provider fetch failed", err);
      return [];
    });

    for (const msg of fetched) {
      const fields = extractSmsFields(msg);
      await admin.rpc("text_rental_store_sms", {
        p_provider_id: row.provider_id,
        p_sms_id: msg.id ? String(msg.id) : null,
        p_from: msg.from || msg.fromValue || null,
        p_to: msg.to || msg.toValue || row.phone_number,
        p_content: fields.content,
        p_parsed_code: fields.code,
        p_received_at:
          msg.createdAt || msg.created_at || new Date().toISOString(),
      });
    }

    return NextResponse.json({ rental: row, messages: await readStored() });
  } catch (err) {
    if (err instanceof TextVerifiedError) {
      return NextResponse.json(
        { message: err.message, code: err.code },
        { status: err.status >= 400 && err.status < 600 ? err.status : 502 },
      );
    }
    console.error("[textverify/rental/sms]", err);
    return NextResponse.json({ message: "Failed to fetch SMS" }, { status: 500 });
  }
}
