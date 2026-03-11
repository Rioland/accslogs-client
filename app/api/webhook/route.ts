import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";

const KORAPAY_SECRET_KEY =
  process.env.KORAPAY_SECRET_KEY ||
  process.env.KORAPAY_WEBHOOK_SECRET ||
  "";

function verifyKorapaySignature(
  payload: string,
  signature: string | null,
): boolean {
  if (!KORAPAY_SECRET_KEY || !signature) return false;
  const parsed = JSON.parse(payload);
  const dataString = JSON.stringify(parsed.data);
  const hash = crypto
    .createHmac("sha256", KORAPAY_SECRET_KEY)
    .update(dataString)
    .digest("hex");
  if (hash.length !== signature.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, "utf8"), Buffer.from(signature, "utf8"));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-korapay-signature");

    if (!verifyKorapaySignature(rawBody, signature)) {
      return NextResponse.json(
        { status: "error", message: "Invalid signature" },
        { status: 401 },
      );
    }

    const { event, data } = JSON.parse(rawBody);

    if (event !== "charge.success") {
      return NextResponse.json({
        status: "error",
        message: `Unhandled event: ${event}`,
      });
    }

    const { amount, status, reference, metadata, payment_reference } = data;

    // Determine the user this payment belongs to.
    // 1) Virtual account deposits: use virtual bank account_reference (we set this to the user id)
    // 2) Checkout/redirect payments: use metadata.userId or, as a fallback, parse payment_reference
    const accountReference =
      data?.virtual_bank_account_details?.virtual_bank_account?.account_reference;

    let userId: string | null = null;

    if (accountReference && typeof accountReference === "string") {
      userId = accountReference;
    } else if (metadata && typeof metadata.userId === "string") {
      userId = metadata.userId;
    } else if (typeof payment_reference === "string") {
      const possibleUserId = payment_reference.split("-")[0];
      if (possibleUserId) {
        userId = possibleUserId;
      }
    }

    if (!userId) {
      console.error("Webhook: Unable to determine user from payload", data);
      return NextResponse.json(
        { status: "error", message: "Missing user identifier" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdminClient();
    const { error: insertError } = await supabase
      .from("deposits")
      .insert({
        user_id: userId,
        amount: Number(amount),
        status: status === "success" ? "successful" : status,
        reference,
        korapay_data: data,
      });

    if (insertError) {
      if (insertError.code === "23505") {
        // Duplicate reference - already processed, return success
        return NextResponse.json({ status: "success", message: "Already processed" });
      }
      console.error("Webhook: Insert error", insertError);
      return NextResponse.json(
        { status: "error", message: "Failed to insert transaction" },
        { status: 500 },
      );
    }

    if (status === "success") {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, funds")
        .eq("id", userId)
        .single();

      if (!profileError && profile) {
        const newFunds = (Number(profile.funds) || 0) + Number(amount);
        await supabase
          .from("profiles")
          .update({ funds: newFunds })
          .eq("id", userId);
      }
    }

    return NextResponse.json({ status: "success", message: "Deposit processed" });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json(
      { status: "error", message: "Internal error" },
      { status: 500 },
    );
  }
}
