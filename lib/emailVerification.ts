import { createHash, randomBytes } from "crypto";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";
import { sendMail } from "@/lib/mailer";
import { verifyEmailHtml } from "@/lib/emailTemplates";

/**
 * App-level email verification (Supabase's own "Confirm email" is off for this
 * project). Tokens are single-use, stored only as a sha256 hash, and expire
 * after 24 hours. All database access uses the service-role client; the
 * tokens table is invisible to browser roles.
 */

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
/** Minimum gap between two verification emails for one user. */
export const RESEND_COOLDOWN_MS = 60 * 1000;
/** Max verification emails per user per rolling 24 hours. */
const MAX_SENDS_PER_DAY = 5;

export class VerificationError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
  ) {
    super(message);
  }
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function appUrl(fallbackOrigin: string) {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_CLIENT_URL?.trim() ||
    fallbackOrigin
  ).replace(/\/$/, "");
}

/**
 * Issue a fresh link and email it. Earlier unused links for the user stop
 * working, so only the newest email is valid.
 */
export async function sendVerificationEmail(opts: {
  userId: string;
  email: string;
  origin: string;
  welcome?: boolean;
}): Promise<{ alreadyVerified: boolean; email: string }> {
  const admin = getSupabaseAdminClient();
  const email = opts.email.trim().toLowerCase();

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("first_name, email_verified_at")
    .eq("id", opts.userId)
    .maybeSingle();
  if (profileError) throw new Error(profileError.message);
  if (!profile) throw new VerificationError("Profile not found.", 404, "no_profile");
  if (profile.email_verified_at) return { alreadyVerified: true, email };

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recent, error: recentError } = await admin
    .from("email_verification_tokens")
    .select("created_at")
    .eq("user_id", opts.userId)
    .gte("created_at", since)
    .order("created_at", { ascending: false });
  if (recentError) throw new Error(recentError.message);

  const last = recent?.[0]?.created_at ? new Date(recent[0].created_at).getTime() : 0;
  if (Date.now() - last < RESEND_COOLDOWN_MS) {
    const wait = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - last)) / 1000);
    throw new VerificationError(
      `Please wait ${wait}s before requesting another link.`,
      429,
      "cooldown",
    );
  }
  if ((recent?.length || 0) >= MAX_SENDS_PER_DAY) {
    throw new VerificationError(
      "Too many verification emails today. Please try again tomorrow or contact support.",
      429,
      "daily_limit",
    );
  }

  // Only the newest link should work.
  await admin
    .from("email_verification_tokens")
    .delete()
    .eq("user_id", opts.userId)
    .is("used_at", null);

  const token = randomBytes(32).toString("base64url");
  const { data: inserted, error: insertError } = await admin
    .from("email_verification_tokens")
    .insert({
      user_id: opts.userId,
      email,
      token_hash: hashToken(token),
      expires_at: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
    })
    .select("id")
    .single();
  if (insertError) throw new Error(insertError.message);

  const verifyUrl = `${appUrl(opts.origin)}/auth/verify-email?token=${token}`;
  try {
    await sendMail({
      to: email,
      subject: opts.welcome
        ? "Welcome to Topnotchlogs — verify your email"
        : "Verify your Topnotchlogs email",
      html: verifyEmailHtml(profile.first_name || "", verifyUrl, {
        welcome: opts.welcome,
      }),
      text: `Verify your Topnotchlogs email address: ${verifyUrl}\n\nThis link expires in 24 hours.`,
    });
  } catch (err) {
    // Don't count a failed send against the user's rate limit.
    await admin.from("email_verification_tokens").delete().eq("id", inserted.id);
    console.error("[verify-email] send failed:", err);
    throw new VerificationError(
      "We couldn't send the email right now. Please try again shortly.",
      502,
      "send_failed",
    );
  }

  return { alreadyVerified: false, email };
}

/** Consume a link token and mark the account verified. */
export async function confirmVerificationToken(token: string) {
  if (!token || token.length < 20 || token.length > 200) {
    throw new VerificationError("This verification link is invalid.", 400, "invalid");
  }
  const admin = getSupabaseAdminClient();
  const tokenHash = hashToken(token);

  const { data: row, error } = await admin
    .from("email_verification_tokens")
    .select("id, user_id, email, expires_at, used_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) {
    throw new VerificationError(
      "This verification link is invalid or has been replaced by a newer one.",
      400,
      "invalid",
    );
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("email_verified_at")
    .eq("id", row.user_id)
    .maybeSingle();

  // Opening the same link twice (or an email scanner opening it first) is fine.
  if (row.used_at) {
    if (profile?.email_verified_at) return { userId: row.user_id };
    throw new VerificationError("This verification link has already been used.", 400, "used");
  }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    throw new VerificationError(
      "This verification link has expired. Request a new one from your dashboard.",
      400,
      "expired",
    );
  }

  // The link must still belong to the account's current email address.
  const { data: authUser, error: authError } = await admin.auth.admin.getUserById(row.user_id);
  if (authError || !authUser?.user) {
    throw new VerificationError("Account not found.", 404, "no_user");
  }
  if ((authUser.user.email || "").toLowerCase() !== row.email.toLowerCase()) {
    throw new VerificationError(
      "Your email address has changed since this link was sent. Request a new link.",
      400,
      "email_changed",
    );
  }

  // Claim the token atomically so a double submit can't race.
  const { data: claimed, error: claimError } = await admin
    .from("email_verification_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", row.id)
    .is("used_at", null)
    .select("id")
    .maybeSingle();
  if (claimError) throw new Error(claimError.message);

  if (claimed && !profile?.email_verified_at) {
    const { error: updateError } = await admin
      .from("profiles")
      .update({ email_verified_at: new Date().toISOString() })
      .eq("id", row.user_id)
      .is("email_verified_at", null);
    if (updateError) throw new Error(updateError.message);
  }

  return { userId: row.user_id };
}
