function brandHeader() {
  return `
    <tr>
      <td style="background-color:#194572;padding:32px 28px;text-align:center;">
        <p style="margin:0;font-size:28px;font-weight:800;letter-spacing:-0.5px;line-height:1.2;">
          <span style="color:#ffffff">Top</span><span style="color:#f87d1f">notch</span><span style="color:#ffffff">logs</span>
        </p>
      </td>
    </tr>
  `;
}

function emailShell(title: string, bodyHtml: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f5f8;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f5f8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
          ${brandHeader()}
          ${bodyHtml}
          <tr>
            <td style="padding:0 28px;">
              <div style="height:1px;background-color:#e5e7eb;line-height:1px;font-size:1px;">&nbsp;</div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 32px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.5;">
                Need help?
                <a href="mailto:support@topnotchlogs.com" style="color:#194572;text-decoration:none;">support@topnotchlogs.com</a>
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:20px 0 0;color:#9ca3af;font-size:11px;line-height:1.4;">
          © ${new Date().getFullYear()} Topnotchlogs. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(href: string, label: string) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 24px;">
      <tr>
        <td align="center" style="background-color:#f87d1f;border-radius:10px;">
          <a href="${href}" target="_blank" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;background-color:#f87d1f;">
            ${label}
          </a>
        </td>
      </tr>
    </table>
  `;
}

export function resetPasswordEmailHtml(resetUrl: string, opts?: { admin?: boolean }) {
  const title = opts?.admin ? 'Reset Admin Password' : 'Reset Password';
  const intro = opts?.admin
    ? 'Follow this link to reset the password for your Topnotchlogs admin account:'
    : 'Follow this link to reset the password for your Topnotchlogs account:';

  const body = `
    <tr>
      <td style="padding:36px 28px 28px;text-align:center;">
        <h2 style="margin:0 0 12px;color:#111827;font-size:24px;font-weight:700;line-height:1.3;">${title}</h2>
        <p style="margin:0 0 28px;color:#4b5563;font-size:15px;line-height:1.6;">${intro}</p>
        ${ctaButton(resetUrl, 'Reset Password')}
        <p style="margin:0 0 8px;color:#6b7280;font-size:13px;line-height:1.5;">
          If the button doesn’t work, copy and paste this link into your browser:
        </p>
        <p style="margin:0;word-break:break-all;font-size:12px;line-height:1.5;">
          <a href="${resetUrl}" target="_blank" style="color:#194572;text-decoration:underline;">${resetUrl}</a>
        </p>
        <p style="margin:24px 0 0;color:#6b7280;font-size:12px;line-height:1.5;">
          If you didn’t request a password reset, you can safely ignore this email.
        </p>
      </td>
    </tr>
  `;

  return emailShell(title, body);
}

export function welcomeEmailHtml(firstName: string, loginUrl: string) {
  const name = firstName?.trim() || 'there';
  const body = `
    <tr>
      <td style="padding:36px 28px 28px;text-align:center;">
        <h2 style="margin:0 0 12px;color:#111827;font-size:24px;font-weight:700;line-height:1.3;">
          Welcome to Topnotchlogs
        </h2>
        <p style="margin:0 0 16px;color:#4b5563;font-size:15px;line-height:1.6;">
          Hi ${name}, thanks for creating your account. You’re all set to browse verified social media accounts and manage your wallet.
        </p>
        <p style="margin:0 0 28px;color:#4b5563;font-size:15px;line-height:1.6;">
          Sign in anytime to get started.
        </p>
        ${ctaButton(loginUrl, 'Sign In')}
      </td>
    </tr>
  `;

  return emailShell('Welcome to Topnotchlogs', body);
}
