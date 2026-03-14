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
  if (process.env.KORAPAY_SKIP_WEBHOOK_VERIFY === "true") return true; // Debug only with ngrok
  if (!KORAPAY_SECRET_KEY || !signature) return false;
  const parsed = JSON.parse(payload);
  const dataString = JSON.stringify(parsed.data);
  const hash = crypto
    .createHmac("sha256", KORAPAY_SECRET_KEY)
    .update(dataString)
    .digest("hex");
  // Compare hex strings - use hex encoding for Buffer (both are hex-encoded hashes)
  if (hash.length !== signature.length) return false;
  try {
    const hashBuf = Buffer.from(hash, "hex");
    const sigBuf = Buffer.from(signature, "hex");
    if (hashBuf.length !== sigBuf.length) return false;
    return crypto.timingSafeEqual(hashBuf, sigBuf);
  } catch {
    // Fallback: simple string compare (if signature isn't valid hex)
    return hash === signature;
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

    // Handle charge events (success and failed)
    if (event !== "charge.success" && event !== "charge.failed") {
      return NextResponse.json({
        status: "ok",
        message: `Event ${event} acknowledged`,
      });
    }

    const { amount, status, reference, metadata, payment_reference } = data;
    const ref = reference || payment_reference;

    // Determine the user this payment belongs to.
    // 1) Virtual account deposits: use virtual bank account_reference (we set this to the user id)
    // 2) Checkout/redirect payments: use metadata.userId, or parse reference (user.id or user.id-timestamp)
    const accountReference =
      data?.virtual_bank_account_details?.virtual_bank_account?.account_reference;

    let userId: string | null = null;

    if (accountReference && typeof accountReference === "string") {
      userId = accountReference;
    } else if (metadata && typeof metadata.userId === "string") {
      userId = metadata.userId;
    } else if (typeof ref === "string") {
      // Reference can be: user.id (UUID) or user.id-timestamp
      const uuidMatch = ref.match(
        /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:-\d+)?$/i
      );
      if (uuidMatch) userId = uuidMatch[1];
    }

    if (!userId) {
      console.error("Webhook: Unable to determine user from payload", data);
      return NextResponse.json(
        { status: "error", message: "Missing user identifier" },
        { status: 400 },
      );
    }

    const depositStatus = status === "success" ? "successful" : "failed";
    const uniqueRef = ref || `kpy-${Date.now()}-${userId.slice(0, 8)}`;

    const supabase = getSupabaseAdminClient();
    const { error: insertError } = await supabase
      .from("deposits")
      .insert({
        user_id: userId,
        amount: Number(amount),
        status: depositStatus,
        reference: uniqueRef,
        korapay_data: data,
      });

    if (insertError) {
      if (insertError.code === "23505") {
        // Duplicate reference - already processed, return success (200) to stop retries
        return NextResponse.json(
          { status: "success", message: "Already processed" },
          { status: 200 }
        );
      }
      console.error("Webhook: Insert error", insertError);
      return NextResponse.json(
        { status: "error", message: "Failed to insert transaction" },
        { status: 500 },
      );
    }

    // Update user profile balance only on successful payment
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

    return NextResponse.json(
      { status: "success", message: "Deposit processed" },
      { status: 200 }
    );
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json(
      { status: "error", message: "Internal error" },
      { status: 500 },
    );
  }
}
