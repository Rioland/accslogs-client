import { NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/billsAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";
import {
  TextVerifiedError,
  extractSmsFields,
  listSms,
  sortSmsNewestFirst,
} from "@/lib/textverified";
import { settleVerification } from "@/lib/textverifySettle";

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
      .from("text_verifications")
      .select(
        "id, user_id, request_id, provider_id, service_name, phone_number, amount_ngn, status, sms_code, sms_content, ends_at, created_at",
      )
      .eq("user_id", user.id);

    if (requestId) query = query.eq("request_id", requestId);
    else query = query.eq("id", Number(id));

    const { data: row, error: rowError } = await query.maybeSingle();
    if (rowError || !row) {
      return NextResponse.json({ message: "Verification not found" }, { status: 404 });
    }

    if (row.status === "completed") {
      return NextResponse.json({
        verification: row,
        messages: [],
        code: row.sms_code,
      });
    }

    // "expired" rows were left behind by older code that marked a number dead
    // without refunding it; they go through the same settle path below.
    if ((row.status !== "active" && row.status !== "expired") || !row.phone_number) {
      return NextResponse.json({
        verification: row,
        messages: [],
        code: null,
      });
    }

    const messages = sortSmsNewestFirst(
      await listSms({
        to: row.phone_number,
        reservationId: row.provider_id || undefined,
      }),
    );

    const latest = messages[0];
    if (latest) {
      const fields = extractSmsFields(latest);
      if (fields.code || fields.content) {
        // Keyed by provider id so it also completes rows older code left
        // marked "expired" (text_verification_complete only accepts active).
        await (row.provider_id
          ? admin.rpc("text_verification_complete_by_provider", {
              p_provider_id: row.provider_id,
              p_sms_code: fields.code,
              p_sms_content: fields.content,
              p_provider_response: latest,
            })
          : admin.rpc("text_verification_complete", {
              p_request_id: row.request_id,
              p_sms_code: fields.code,
              p_sms_content: fields.content,
              p_provider_response: latest,
            }));

        return NextResponse.json({
          verification: {
            ...row,
            status: "completed",
            sms_code: fields.code,
            sms_content: fields.content,
          },
          messages,
          code: fields.code,
        });
      }
    }

    // Window closed with no code. Settle it here rather than just marking it
    // expired: an expired-but-unrefunded row is money the customer paid for a
    // number that never worked. Settling refunds it, or completes it if a code
    // slipped in at the last second.
    const windowClosed =
      row.status === "expired" ||
      (row.ends_at && new Date(row.ends_at).getTime() < Date.now());
    if (windowClosed) {
      const result = await settleVerification(
        admin,
        row,
        "No code received before the number expired",
      );
      if (result.outcome === "completed") {
        return NextResponse.json({
          verification: {
            ...row,
            status: "completed",
            sms_code: result.code,
            sms_content: result.content,
          },
          messages,
          code: result.code,
        });
      }
      if (result.outcome === "refunded") {
        return NextResponse.json({
          verification: { ...row, status: "refunded" },
          messages,
          code: null,
          refunded: result.refunded,
        });
      }
      // Undecided (provider unreachable): leave it active and try again on
      // the next poll.
    }

    return NextResponse.json({
      verification: row,
      messages,
      code: null,
    });
  } catch (err) {
    if (err instanceof TextVerifiedError) {
      return NextResponse.json(
        { message: err.message, code: err.code },
        { status: err.status >= 400 && err.status < 600 ? err.status : 502 },
      );
    }
    console.error("[textverify/sms]", err);
    return NextResponse.json({ message: "Failed to fetch SMS" }, { status: 500 });
  }
}
