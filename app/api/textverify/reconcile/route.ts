import crypto from "crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";
import { settleStaleVerifications } from "@/lib/textverifySettle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Settles verifications whose window closed with nobody watching: refunds the
 * ones that never got a code and completes the ones that did. Called on a
 * schedule by netlify/functions/textverify-reconcile.mjs.
 *
 * Protected by TEXTVERIFY_CRON_SECRET. With the variable unset the route is
 * disabled, so deploying this changes nothing until it is configured.
 */
function authorized(req: Request): boolean {
  const secret = process.env.TEXTVERIFY_CRON_SECRET?.trim();
  if (!secret) return false;
  const header = req.headers.get("authorization") || "";
  const a = Buffer.from(header);
  const b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function handle(req: Request) {
  if (!process.env.TEXTVERIFY_CRON_SECRET?.trim()) {
    return NextResponse.json(
      { message: "Reconcile is disabled: set TEXTVERIFY_CRON_SECRET to enable it." },
      { status: 503 },
    );
  }
  if (!authorized(req)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = getSupabaseAdminClient();
    const summary = await settleStaleVerifications(admin, { limit: 20 });
    if (summary.checked > 0) {
      console.info("[textverify/reconcile]", summary);
    }
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    console.error("[textverify/reconcile]", err);
    return NextResponse.json({ message: "Reconcile failed" }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
