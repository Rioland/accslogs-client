import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";

/**
 * Fallback for when Korapay webhook doesn't reach the server (e.g. localhost).
 * Called from client onSuccess - processes deposit if it doesn't exist yet.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { reference, amount, status } = body as {
      reference?: string;
      amount?: number | string;
      status?: string;
    };

    if (!reference || !amount) {
      return NextResponse.json(
        { status: "error", message: "Missing reference or amount" },
        { status: 400 }
      );
    }

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { status: "error", message: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnon) {
      return NextResponse.json(
        { status: "error", message: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnon);
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json(
        { status: "error", message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify reference belongs to this user (format: user.id-timestamp)
    const uuidMatch = reference.match(
      /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:-\d+)?$/i
    );
    const refUserId = uuidMatch ? uuidMatch[1] : null;
    if (!refUserId || refUserId !== user.id) {
      return NextResponse.json(
        { status: "error", message: "Reference does not match user" },
        { status: 403 }
      );
    }

    const amountNum = Number(amount);
    if (Number.isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { status: "error", message: "Invalid amount" },
        { status: 400 }
      );
    }

    // Only process successful payments
    if (status && status !== "success") {
      return NextResponse.json(
        { status: "ok", message: "Payment not successful, skipping" },
        { status: 200 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // Check if deposit already exists (webhook may have processed it)
    const { data: existing } = await supabase
      .from("deposits")
      .select("id")
      .eq("reference", reference)
      .single();

    if (existing) {
      return NextResponse.json(
        { status: "success", message: "Already processed" },
        { status: 200 }
      );
    }

    // Insert deposit and update balance
    const { error: insertError } = await supabase.from("deposits").insert({
      user_id: user.id,
      amount: amountNum,
      status: "successful",
      reference,
      korapay_data: {
        source: "confirm_deposit_fallback",
        confirmed_via: "onSuccess",
      },
    });

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json(
          { status: "success", message: "Already processed" },
          { status: 200 }
        );
      }
      console.error("Confirm deposit insert error:", insertError);
      return NextResponse.json(
        { status: "error", message: "Failed to record deposit" },
        { status: 500 }
      );
    }

    // Update profile balance
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, funds")
      .eq("id", user.id)
      .single();

    if (!profileError && profile) {
      const newFunds = (Number(profile.funds) || 0) + amountNum;
      await supabase
        .from("profiles")
        .update({ funds: newFunds })
        .eq("id", user.id);
    }

    return NextResponse.json(
      { status: "success", message: "Deposit confirmed and balance updated" },
      { status: 200 }
    );
  } catch (err) {
    console.error("Confirm deposit error:", err);
    return NextResponse.json(
      { status: "error", message: "Internal error" },
      { status: 500 }
    );
  }
}
