function escapeHtml(str: string): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function verificationEmail(opts: { name: string; verifyUrl: string }) {
  const firstName = opts.name.split(' ')[0] || opts.name
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f0;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#111827;padding:24px 32px;">
          <span style="font-size:20px;font-weight:700;color:#fff;">Host<span style="color:#C9A84C;">Masters</span></span>
        </td></tr>
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">Confirm your email</h2>
          <p style="font-size:15px;color:#555;margin:0 0 24px;">
            Hi ${escapeHtml(firstName)},<br><br>
            Welcome to HostMasters. Please confirm your email address so we can finish setting up your account.
          </p>
          <p style="margin:0 0 24px;">
            <a href="${opts.verifyUrl}" style="display:inline-block;background:#C9A84C;color:#111827;font-weight:700;font-size:14px;padding:12px 24px;border-radius:6px;text-decoration:none;">
              Confirm my email
            </a>
          </p>
          <p style="font-size:12px;color:#999;word-break:break-all;">Or paste this link in your browser:<br>${opts.verifyUrl}</p>
          <p style="font-size:13px;color:#999;margin-top:24px;">This link expires in 24 hours. If you didn&rsquo;t create this account, you can safely ignore this email.</p>
        </td></tr>
        <tr><td style="background:#f9f9f7;padding:20px 32px;border-top:1px solid #ececec;">
          <p style="margin:0;font-size:12px;color:#999;">HostMasters · Costa Tropical, Spain</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}
