import { NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/billsAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";
import {
  TextVerifiedError,
  extractRentalRefund,
  getRental,
  refundRental,
} from "@/lib/textverified";

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
      .from("text_rentals")
      .select("id, user_id, request_id, provider_id, is_renewable, status")
      .eq("user_id", user.id);

    if (requestId) query = query.eq("request_id", requestId);
    else query = query.eq("id", Number(id));

    const { data: row, error: rowError } = await query.maybeSingle();
    if (rowError || !row) {
      return NextResponse.json({ message: "Rental not found" }, { status: 404 });
    }

    if (["refunded", "expired", "cancelled"].includes(row.status)) {
      return NextResponse.json(
        { message: `Cannot refund a ${row.status} rental` },
        { status: 400 },
      );
    }

    // The provider owns the refund window. The wallet is only credited once
    // the provider has actually refunded us — crediting it when they decline
    // hands the customer a rental we have already paid for.
    if (row.provider_id) {
      const isRenewable = Boolean(row.is_renewable);

      // Ask first so a rental past its window gets a clear answer instead of
      // a raw provider error. If the lookup itself fails, the refund call
      // below still decides.
      try {
        const details = await getRental(row.provider_id, isRenewable);
        const { canRefund, refundableUntil } = extractRentalRefund(details);
        if (canRefund === false) {
          const until = refundableUntil
            ? ` The refund window closed on ${new Date(refundableUntil).toUTCString()}.`
            : "";
          return NextResponse.json(
            {
              message: `This rental can no longer be refunded.${until}`,
              code: "not_refundable",
            },
            { status: 409 },
          );
        }
      } catch (lookupErr) {
        console.warn("[textverify/rental/refund] eligibility lookup failed", lookupErr);
      }

      try {
        await refundRental(row.provider_id, isRenewable);
      } catch (refundErr) {
        console.error("[textverify/rental/refund] provider", refundErr);
        const declined =
          refundErr instanceof TextVerifiedError &&
          refundErr.status >= 400 &&
          refundErr.status < 500 &&
          refundErr.status !== 429;
        return NextResponse.json(
          declined
            ? {
                message: `The provider declined this refund: ${(refundErr as TextVerifiedError).message}`,
                code: "refund_declined",
              }
            : {
                message:
                  "Couldn't reach the provider to process the refund. Your rental is unchanged — please try again in a moment.",
                code: "provider_unreachable",
              },
          { status: declined ? 409 : 502 },
        );
      }
    }

    const { data: refundResult, error: refundError } = await admin.rpc(
      "text_rental_fail_and_refund",
      {
        p_request_id: row.request_id,
        p_error_message: "Refunded by user",
        p_provider_response: null,
      },
    );

    if (refundError) {
      console.error(
        `[textverify/rental/refund] provider refunded ${row.provider_id} but wallet credit failed`,
        refundError,
      );
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
    console.error("[textverify/rental/refund]", err);
    return NextResponse.json({ message: "Failed to refund rental" }, { status: 500 });
  }
}
