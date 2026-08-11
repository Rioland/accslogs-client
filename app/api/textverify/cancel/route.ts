import { NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/billsAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";
import { TextVerifiedError, cancelVerification } from "@/lib/textverified";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { user, error } = await getAuthedUser(req);
    if (error || !user) return error!;

    const body = (await req.json()) as { request_id?: string; id?: number };
    const requestId = body.request_id;
    const id = body.id;

    if (!requestId && !id) {
      return NextResponse.json(
        { message: "request_id or id is required" },
        { status: 400 },
      );
    }

    const admin = getSupabaseAdminClient();
    let query = admin
      .from("text_verifications")
      .select("id, user_id, request_id, provider_id, status")
      .eq("user_id", user.id);

    if (requestId) query = query.eq("request_id", requestId);
    else query = query.eq("id", Number(id));

    const { data: row, error: rowError } = await query.maybeSingle();
    if (rowError || !row) {
      return NextResponse.json({ message: "Verification not found" }, { status: 404 });
    }

    if (["completed", "refunded", "cancelled"].includes(row.status)) {
      return NextResponse.json(
        { message: `Cannot cancel a ${row.status} verification` },
        { status: 400 },
      );
    }

    if (row.provider_id) {
      try {
        await cancelVerification(row.provider_id);
      } catch (cancelErr) {
        // Still refund locally if provider cancel fails (number may already be gone)
        console.error("[textverify/cancel] provider", cancelErr);
      }
    }

    const { data: refundResult, error: refundError } = await admin.rpc(
      "text_verification_fail_and_refund",
      {
        p_request_id: row.request_id,
        p_error_message: "Cancelled by user",
        p_provider_response: null,
      },
    );

    if (refundError) {
      return NextResponse.json(
        { message: refundError.message || "Refund failed" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      refunded: refundResult?.refunded ?? null,
    });
  } catch (err) {
    if (err instanceof TextVerifiedError) {
      return NextResponse.json(
        { message: err.message, code: err.code },
        { status: err.status >= 400 && err.status < 600 ? err.status : 502 },
      );
    }
    console.error("[textverify/cancel]", err);
    return NextResponse.json({ message: "Failed to cancel" }, { status: 500 });
  }
}
