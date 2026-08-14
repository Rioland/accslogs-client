import { NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/billsAuth";
import { getSupabaseAdminClient, isMissingTableError } from "@/lib/supabaseServer";
import { extractEpins } from "@/lib/ebills";

export const runtime = "nodejs";

/**
 * Bill payment history with the deliverables the customer actually needs to
 * copy: electricity tokens, meter units, and ePIN codes.
 *
 * The raw provider_response is deliberately NOT returned — it carries our
 * wholesale cost and the provider discount, i.e. our margin.
 */
export async function GET(req: Request) {
  try {
    const { user, error } = await getAuthedUser(req);
    if (error || !user) return error!;

    const admin = getSupabaseAdminClient();
    const { data, error: qError } = await admin
      .from("bill_payments")
      .select(
        "id, request_id, product_type, service_id, customer_id, variation_id, amount, status, provider_order_id, provider_token, provider_units, provider_response, error_message, created_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (qError) {
      if (isMissingTableError(qError)) {
        console.warn("[bills/history] bill_payments table missing");
        return NextResponse.json({ payments: [], setupRequired: true });
      }
      return NextResponse.json({ message: qError.message }, { status: 500 });
    }

    const payments = (data || []).map((row) => {
      const epins = extractEpins(row.provider_response).map((p) => ({
        amount: p.amount ?? null,
        pin: p.pin ?? null,
        serial: p.serial ?? null,
        instruction: p.instruction ?? null,
      }));

      // These product types owe the customer something to copy. If it is not
      // stored yet the order was still processing when we bought it, and a
      // requery can collect it.
      const owesDeliverable =
        row.product_type === "electricity" || row.product_type === "epins";
      const hasDeliverable = !!row.provider_token || epins.length > 0;
      const awaitingDelivery =
        owesDeliverable &&
        !hasDeliverable &&
        row.status !== "refunded" &&
        row.status !== "failed";

      return {
        id: row.id,
        request_id: row.request_id,
        product_type: row.product_type,
        service_id: row.service_id,
        customer_id: row.customer_id,
        variation_id: row.variation_id,
        amount: Number(row.amount),
        status: row.status,
        order_id: row.provider_order_id,
        // Electricity prepaid token + units purchased
        token: row.provider_token,
        units: row.provider_units,
        epins,
        awaiting_delivery: awaitingDelivery,
        error_message: row.error_message,
        created_at: row.created_at,
      };
    });

    return NextResponse.json({ payments });
  } catch (err) {
    console.error("[bills/history]", err);
    return NextResponse.json(
      { message: "Failed to load bill payments" },
      { status: 500 },
    );
  }
}
