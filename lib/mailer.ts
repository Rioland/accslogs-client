import nodemailer from 'nodemailer';

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

export function getMailer() {
  const host = requireEnv('SMTP_HOST');
  const port = Number(process.env.SMTP_PORT || '587');
  const user = requireEnv('SMTP_USER');
  const pass = requireEnv('SMTP_PASS');

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendMail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const from = process.env.SMTP_FROM?.trim() || requireEnv('SMTP_USER');
  const transporter = getMailer();
  await transporter.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}
