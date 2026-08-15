import { NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/billsAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";
import {
  TextVerifiedError,
  cancelVerification,
  extractSmsFields,
  getVerification,
  listSms,
} from "@/lib/textverified";

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
      // Check the provider's view BEFORE refunding. If the code actually
      // arrived and we simply missed the webhook, refunding here would hand
      // back the money for a verification that was delivered.
      let providerState: string | null = null;
      try {
        const details = await getVerification(row.provider_id);
        providerState = String(details.state || "");
      } catch (stateErr) {
        console.warn("[textverify/cancel] could not read provider state", stateErr);
      }

      if (providerState === "verificationCompleted") {
        const messages = await listSms({
          reservationId: row.provider_id,
        }).catch(() => []);
        const fields = messages[0]
          ? extractSmsFields(messages[0])
          : { code: null, content: null };

        await admin.rpc("text_verification_complete", {
          p_request_id: row.request_id,
          p_sms_code: fields.code,
          p_sms_content: fields.content,
          p_provider_response: null,
        });

        return NextResponse.json(
          {
            success: false,
            completed: true,
            code: fields.code,
            message:
              "Your code arrived just before this was cancelled, so the number was used and cannot be refunded.",
          },
          { status: 409 },
        );
      }

      try {
        await cancelVerification(row.provider_id);
      } catch (cancelErr) {
        // A number that already timed out cannot be cancelled — the provider
        // reports canCancel:false. That is the normal end of an unused
        // verification, not a failure, so it is not logged as an error. We
        // refund locally either way; TextVerified refunds their side.
        const expected =
          cancelErr instanceof TextVerifiedError &&
          cancelErr.code === "cannot_cancel";
        if (expected) {
          console.info(
            `[textverify/cancel] ${row.request_id} already timed out at provider — refunding locally`,
          );
        } else {
          console.error("[textverify/cancel] provider", cancelErr);
        }
      }
    }

    const { data: refundResult, error: refundError } = await admin.rpc(
      "text_verification_fail_and_refund",
      {
        p_request_id: row.request_id,
        p_error_message: reason,
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
