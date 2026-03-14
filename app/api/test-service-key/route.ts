import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";

/**
 * Test endpoint to verify SUPABASE_SERVICE_ROLE_KEY works.
 * GET /api/test-service-key
 * Remove or protect this route in production.
 */
export async function GET() {
  try {
    const supabase = getSupabaseAdminClient();

    // Simple test: fetch one row from a table that exists (profiles or socialmedia_account_category)
    const { data, error } = await supabase
      .from("socialmedia_account_category")
      .select("id, name")
      .limit(1);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
          hint: error.hint,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Service role key works",
      data,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
