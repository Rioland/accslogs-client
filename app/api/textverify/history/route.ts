import { NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/billsAuth";
import { getSupabaseAdminClient, isMissingTableError } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { user, error } = await getAuthedUser(req);
    if (error || !user) return error!;

    const admin = getSupabaseAdminClient();
    const { data, error: qError } = await admin
      .from("text_verifications")
      .select(
        "id, request_id, provider_id, service_name, phone_number, amount_usd, amount_ngn, status, sms_code, ends_at, created_at",
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
