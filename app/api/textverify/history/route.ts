import { NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/billsAuth";
import { getSupabaseAdminClient, isMissingTableError } from "@/lib/supabaseServer";
import { settleStaleVerifications } from "@/lib/textverifySettle";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { user, error } = await getAuthedUser(req);
    if (error || !user) return error!;

    const admin = getSupabaseAdminClient();

    // A number whose window closed while the customer was away (tab closed,
    // connection dropped) was never refunded by the browser countdown. Settle
    // those before listing, so the customer sees their money back — or their
    // late code — instead of a number stuck on "active". Best-effort: a
    // provider hiccup must never break the history list.
    try {
      await settleStaleVerifications(admin, {
        userId: user.id,
        limit: 5,
        parallel: true,
      });
    } catch (settleErr) {
      if (!isMissingTableError(settleErr as { code?: string; message?: string })) {
        console.warn("[textverify/history] settling stale verifications failed", settleErr);
      }
    }

    const { data, error: qError } = await admin
      .from("text_verifications")
      .select(
        "id, request_id, provider_id, service_name, capability, phone_number, area_code, amount_ngn, status, sms_code, sms_content, error_message, ends_at, created_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (qError) {
      // Before the migration runs the user genuinely has no verifications, so
      // an empty list is the truthful answer. 500ing here breaks the whole page.
      if (isMissingTableError(qError)) {
        console.warn(
          "[textverify/history] text_verifications table missing — run `supabase db push`",
        );
        return NextResponse.json({ verifications: [], setupRequired: true });
      }
      return NextResponse.json({ message: qError.message }, { status: 500 });
    }

    return NextResponse.json({ verifications: data || [] });
  } catch (err) {
    console.error("[textverify/history]", err);
    return NextResponse.json({ message: "Failed to load history" }, { status: 500 });
  }
}
