import { NextRequest, NextResponse } from 'next/server';
import { sendMail } from '@/lib/mailer';
import { welcomeEmailHtml } from '@/lib/emailTemplates';

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
    const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : '';

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const appUrl = getAppUrl(request);
    const loginUrl = `${appUrl}/login`;

    await sendMail({
      to: email,
      subject: 'Welcome to Topnotchlogs',
      html: welcomeEmailHtml(firstName, loginUrl),
      text: `Welcome to Topnotchlogs${firstName ? `, ${firstName}` : ''}! Sign in at ${loginUrl}`,
    });

    return NextResponse.json({ message: 'Welcome email sent.' });
  } catch (err) {
    console.error('welcome email:', err);
    // Don't fail signup UX if welcome mail fails
    return NextResponse.json(
      { error: 'Welcome email could not be sent.', message: 'Skipped' },
      { status: 200 },
    );
  }
}
