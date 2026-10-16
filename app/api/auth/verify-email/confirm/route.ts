import { NextRequest, NextResponse } from "next/server";
import { VerificationError, confirmVerificationToken } from "@/lib/emailVerification";

export const runtime = "nodejs";

/**
 * Consume a verification token from the emailed link. No session needed: the
 * link may be opened on a different device from the one the user signed in on.
 * POST (not GET) so link scanners that prefetch URLs can't spend the token.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    await confirmVerificationToken(token);
    return NextResponse.json({ verified: true });
  } catch (err) {
    if (err instanceof VerificationError) {
      return NextResponse.json({ message: err.message, code: err.code }, { status: err.status });
    }
    console.error("[verify-email/confirm]", err);
    return NextResponse.json({ message: "Could not verify your email." }, { status: 500 });
  }
}
