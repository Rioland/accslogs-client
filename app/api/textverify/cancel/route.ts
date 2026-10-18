import { NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/billsAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";
import { TextVerifiedError } from "@/lib/textverified";
import { SETTLE_COLUMNS, settleVerification, type SettleRow } from "@/lib/textverifySettle";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { user, error } = await getAuthedUser(req);
    if (error || !user) return error!;

    const body = (await req.json()) as {
      request_id?: string;
      id?: number;
      reason?: string;
    };
    const requestId = body.request_id;
    const id = body.id;
    // Distinguishes a deliberate cancel from an automatic timeout in the audit
    // trail, so support can tell why a refund happened.
    const reason =
      body.reason === "timeout"
        ? "No code received before the timer ran out"
        : "Cancelled by user";

    if (!requestId && !id) {
      return NextResponse.json(
        { message: "request_id or id is required" },
        { status: 400 },
      );
    }

    const admin = getSupabaseAdminClient();
    let query = admin
      .from("text_verifications")
      .select(SETTLE_COLUMNS)
      .eq("user_id", user.id);

    if (requestId) query = query.eq("request_id", requestId);
    else query = query.eq("id", Number(id));

    const { data: row, error: rowError } = await query.maybeSingle();
    if (rowError || !row) {
      return NextResponse.json({ message: "Verification not found" }, { status: 404 });
    }

    // Safe to call more than once: the countdown, the SMS poll and the
    // customer can all try to end the same number, and every caller gets the
    // same final answer rather than an error for arriving second.
    const result = await settleVerification(admin, row as SettleRow, reason);

    switch (result.outcome) {
      case "completed":
        return NextResponse.json(
          {
            success: false,
            completed: true,
            code: result.code,
            content: result.content,
            message:
              "Your code arrived before this could be cancelled, so the number was used and cannot be refunded.",
          },
          { status: 409 },
        );
      case "refunded":
        return NextResponse.json({ success: true, refunded: result.refunded });
      case "unchanged":
        return NextResponse.json(
          { message: `Cannot cancel a ${result.status} verification` },
          { status: 400 },
        );
      case "retry":
        return NextResponse.json(
          { message: result.message, code: "retry" },
          { status: 502 },
        );
    }
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
