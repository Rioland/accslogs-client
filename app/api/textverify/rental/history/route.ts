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
      .from("text_rentals")
      .select(
        "id, request_id, provider_id, service_name, capability, phone_number, area_code, is_renewable, duration, amount_ngn, status, error_message, ends_at, created_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (qError) {
      // Before the migration runs the user genuinely has no rentals, so an
      // empty list is the truthful answer. 500ing here breaks the whole page.
      if (isMissingTableError(qError)) {
        console.warn(
          "[textverify/rental/history] text_rentals table missing — run `supabase db push`",
        );
        return NextResponse.json({ rentals: [], setupRequired: true });
      }
      return NextResponse.json({ message: qError.message }, { status: 500 });
    }

    return NextResponse.json({ rentals: data || [] });
  } catch (err) {
    console.error("[textverify/rental/history]", err);
    return NextResponse.json({ message: "Failed to load rentals" }, { status: 500 });
  }
}
