import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabaseServer';
import { sendMail } from '@/lib/mailer';
import { resetPasswordEmailHtml } from '@/lib/emailTemplates';

const GENERIC_SUCCESS = {
  message:
    "If an account with that email exists, we've sent you a password reset link.",
};

function isValidEmail(email: string) {
  return /^(?:[a-zA-Z0-9_'^&+%?`{|}~-]+(?:\.[a-zA-Z0-9_'^&+%?`{|}~-]+)*|"(?:[^"]|\\")+")@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(
    email,
  );
}

function getAppUrl(request: NextRequest) {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_CLIENT_URL?.trim() ||
    request.nextUrl.origin
  ).replace(/\/$/, '');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const appUrl = getAppUrl(request);
    const redirectTo = `${appUrl}/reset-password`;
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo },
    });

    // Always return the same message to avoid email enumeration.
    if (error || !data?.properties?.action_link) {
      console.error('forgot-password generateLink:', error?.message || 'No action_link');
      return NextResponse.json(GENERIC_SUCCESS);
    }

    try {
      await sendMail({
        to: email,
        subject: 'Reset your Topnotchlogs password',
        html: resetPasswordEmailHtml(data.properties.action_link),
        text: `Reset your password: ${data.properties.action_link}`,
      });
    } catch (mailError) {
      console.error('forgot-password sendMail:', mailError);
      return NextResponse.json(
        { error: 'Unable to send reset email. Please try again later.' },
        { status: 500 },
      );
    }

    return NextResponse.json(GENERIC_SUCCESS);
  } catch (err) {
    console.error('forgot-password unexpected:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
