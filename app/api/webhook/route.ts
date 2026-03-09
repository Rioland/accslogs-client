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

    const { amount, status, reference } = data;
    const accountReference =
      data?.virtual_bank_account_details?.virtual_bank_account?.account_reference;

    if (!accountReference) {
      console.error("Webhook: Missing account_reference in payload");
      return NextResponse.json(
        { status: "error", message: "Missing account_reference" },
        { status: 400 },
      );
    }

    // account_reference is the user id (uuid) we used when creating the virtual account
    const userId = accountReference;

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
