import { NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/billsAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";
import { TextVerifiedError, listSms } from "@/lib/textverified";

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

    if (row.status !== "active" || !row.phone_number) {
      return NextResponse.json({ rental: row, messages: [] });
    }

    if (row.ends_at && new Date(row.ends_at).getTime() < Date.now()) {
      await admin
        .from("text_rentals")
        .update({ status: "expired", updated_at: new Date().toISOString() })
        .eq("id", row.id)
        .eq("status", "active");
      return NextResponse.json({
        rental: { ...row, status: "expired" },
        messages: [],
      });
    }

    const messages = await listSms({
      to: row.phone_number,
      reservationId: row.provider_id || undefined,
    });

    return NextResponse.json({ rental: row, messages });
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
