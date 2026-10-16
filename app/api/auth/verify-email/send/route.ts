import { NextRequest, NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/billsAuth";
import { VerificationError, sendVerificationEmail } from "@/lib/emailVerification";

export const runtime = "nodejs";

/**
 * Email the signed-in user a verification link. `{ welcome: true }` is sent
 * right after sign-up so the email doubles as the welcome message.
 */
export async function POST(req: NextRequest) {
  try {
    const { user, error } = await getAuthedUser(req);
    if (error || !user) return error!;
    if (!user.email) {
      return NextResponse.json({ message: "Your account has no email address." }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const result = await sendVerificationEmail({
      userId: user.id,
      email: user.email,
      origin: req.nextUrl.origin,
      welcome: body?.welcome === true,
    });

    if (result.alreadyVerified) {
      return NextResponse.json({ alreadyVerified: true });
    }
    return NextResponse.json({ sent: true, email: result.email });
  } catch (err) {
    if (err instanceof VerificationError) {
      return NextResponse.json({ message: err.message, code: err.code }, { status: err.status });
    }
    console.error("[verify-email/send]", err);
    return NextResponse.json({ message: "Could not send verification email." }, { status: 500 });
  }
}
