import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY || 'placeholder')

function safeUrl(url: string | undefined): string | undefined {
  if (!url) return undefined
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return undefined
    return url
  } catch {
    return undefined
  }
}

function escapeHtml(str: string): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set, skipping email')
    return null
  }
  const safeSubject = subject.replace(/[\r\n]/g, ' ').slice(0, 200)
  const result = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'HostMasters <noreply@hostmasters.es>',
    to,
    subject: safeSubject,
    html,
  })
  if (result.error) {
    console.error('Resend error:', result.error)
    throw new Error(`Email send failed: ${result.error.message}`)
  }
  return result
}

export function newBookingEmail(guestName: string, propertyName: string, checkIn: string, checkOut: string) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e3a5f;">New Booking Received</h2>
      <p>A new reservation has been made:</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px; font-weight: bold;">Property:</td><td style="padding: 8px;">${escapeHtml(propertyName)}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Guest:</td><td style="padding: 8px;">${escapeHtml(guestName)}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Check-in:</td><td style="padding: 8px;">${checkIn}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Check-out:</td><td style="padding: 8px;">${checkOut}</td></tr>
      </table>
      <p style="color: #666; margin-top: 20px;">— Hostmaster Team</p>
    </div>
  `
}

export function checkoutReminderEmail(guestName: string, propertyName: string, checkoutDate: string) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e3a5f;">Checkout Tomorrow</h2>
      <p><strong>${escapeHtml(guestName)}</strong> is checking out of <strong>${escapeHtml(propertyName)}</strong> tomorrow (${checkoutDate}).</p>
      <p>Please ensure cleaning and inspection tasks are scheduled.</p>
      <p style="color: #666; margin-top: 20px;">— Hostmaster Team</p>
    </div>
  `
}

export function taskCompletedEmail(opts: {
  propertyName: string
  taskTitle: string
  taskType: string
  condition?: string
  issues?: string
  notes?: string
}) {
  const { propertyName, taskTitle, taskType, condition, issues, notes } = opts
  const conditionLabel = condition === 'good' ? 'Good condition'
    : condition === 'minor' ? 'Minor issues observed'
    : condition === 'major' ? 'Major issues — follow-up required'
    : ''
  return `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1A1A1A;">
      <div style="border-bottom: 2px solid #C9A84C; padding-bottom: 12px; margin-bottom: 24px;">
        <h2 style="color: #1A1A1A; margin: 0;">Visit completed at ${escapeHtml(propertyName)}</h2>
        <p style="color: #777; margin: 4px 0 0 0; font-size: 13px;">${escapeHtml(taskTitle)} · ${escapeHtml(taskType.replace(/_/g, ' ').toLowerCase())}</p>
      </div>
      ${conditionLabel ? `<p><strong>Status:</strong> ${escapeHtml(conditionLabel)}</p>` : ''}
      ${issues ? `<p><strong>Notes from our team:</strong><br/>${escapeHtml(issues).replace(/\n/g, '<br/>')}</p>` : ''}
      ${notes ? `<p style="color: #555;">${escapeHtml(notes).replace(/\n/g, '<br/>')}</p>` : ''}
      <p style="margin-top: 24px;">You can view the full report in your dashboard at any time.</p>
      <p style="color: #999; margin-top: 24px; font-size: 12px;">— HostMasters · Costa Tropical, Spain</p>
    </div>
  `
}

export function monthlyReportEmail(propertyName: string, month: string, year: number) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e3a5f;">Monthly Report Available</h2>
      <p>Your monthly report for <strong>${escapeHtml(propertyName)}</strong> (${escapeHtml(month)} ${year}) is now available.</p>
      <p>Log in to your dashboard to view and download the full report.</p>
      <p style="color: #666; margin-top: 20px;">— Hostmaster Team</p>
    </div>
  `
}

export function monthlyStatementEmail(opts: {
  ownerName: string
  propertyName: string
  month: string
  year: number
  grossRevenue: number
  totalExpenses: number
  commissionRate: number
  commission: number
  ownerPayout: number
  reservationCount: number
  dashboardUrl?: string
}) {
  const name = opts.ownerName.split(' ')[0] || opts.ownerName
  const fmt = (n: number) => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(n)
  const body = `
    <h2 style="margin:0 0 4px;font-size:22px;color:#111827;">Monthly Statement</h2>
    <p style="margin:0 0 24px;font-size:13px;color:#999;">${escapeHtml(opts.month)} ${opts.year} · ${escapeHtml(opts.propertyName)}</p>
    <p style="font-size:15px;color:#555;margin:0 0 24px;">Dear ${escapeHtml(name)},<br><br>Here is your financial summary for <strong>${escapeHtml(opts.propertyName)}</strong> in <strong>${escapeHtml(opts.month)} ${opts.year}</strong>.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e8e4;border-radius:6px;overflow:hidden;margin:0 0 24px;">
      <tr style="background:#f9f9f7;">
        <td colspan="2" style="padding:10px 16px;font-size:11px;font-weight:700;text-transform:uppercase;color:#999;letter-spacing:0.5px;">Monthly Summary</td>
      </tr>
      <tr><td style="padding:10px 16px;font-size:14px;color:#444;">Reservations</td><td style="padding:10px 16px;font-size:14px;color:#111;text-align:right;">${opts.reservationCount}</td></tr>
      <tr style="background:#fafafa;"><td style="padding:10px 16px;font-size:14px;color:#444;">Gross rental income</td><td style="padding:10px 16px;font-size:14px;color:#111;text-align:right;font-weight:600;">${fmt(opts.grossRevenue)}</td></tr>
      <tr><td style="padding:10px 16px;font-size:14px;color:#444;">Expenses</td><td style="padding:10px 16px;font-size:14px;color:#c0392b;text-align:right;">− ${fmt(opts.totalExpenses)}</td></tr>
      <tr style="background:#fff8f0;"><td style="padding:10px 16px;font-size:14px;color:#92681a;">HostMasters commission (${opts.commissionRate}%)</td><td style="padding:10px 16px;font-size:14px;color:#92681a;text-align:right;">− ${fmt(opts.commission)}</td></tr>
      <tr style="background:#f0fdf4;border-top:2px solid #bbf7d0;">
        <td style="padding:14px 16px;font-size:15px;font-weight:700;color:#111827;">Net payout to you</td>
        <td style="padding:14px 16px;font-size:20px;font-weight:700;color:#16a34a;text-align:right;">${fmt(opts.ownerPayout)}</td>
      </tr>
    </table>

    ${opts.grossRevenue === 0
      ? `<p style="font-size:14px;color:#888;text-align:center;padding:16px;background:#fafafa;border-radius:6px;">No reservations recorded for this period.</p>`
      : ''
    }

    ${safeUrl(opts.dashboardUrl) ? `<p style="margin:20px 0 0;"><a href="${opts.dashboardUrl}" style="display:inline-block;background:#111827;color:#fff;font-weight:600;font-size:14px;padding:11px 22px;border-radius:6px;text-decoration:none;">View full report in portal</a></p>` : ''}
    <p style="margin:32px 0 0;font-size:14px;color:#777;">Thank you for trusting us with your property.<br>— The HostMasters Team</p>
  `
  return baseWrapper(body)
}

// ─── Finance emails ────────────────────────────────────────────────────────────

function baseWrapper(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f0;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#111827;padding:24px 32px;">
            <span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
              Host<span style="color:#C9A84C;">Masters</span>
            </span>
            <span style="display:inline-block;margin-left:8px;background:rgba(201,168,76,0.15);color:#C9A84C;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:2px 8px;border-radius:4px;">
              Costa Tropical · España
            </span>
          </td>
        </tr>
        <tr><td style="padding:32px;">${content}</td></tr>
        <tr>
          <td style="background:#f9f9f7;padding:20px 32px;border-top:1px solid #ececec;">
            <p style="margin:0;font-size:12px;color:#999;">HostMasters · Property Management · Costa Tropical, Spain</p>
            <p style="margin:4px 0 0;font-size:12px;color:#bbb;">This is an automated message — please do not reply directly to this email.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function receiptTable(opts: {
  invoiceId: string
  description: string
  amount: number
  currency: string
  dueDate?: string | null
  notes?: string | null
}) {
  const fmtAmount = new Intl.NumberFormat('en-IE', { style: 'currency', currency: opts.currency || 'EUR' }).format(opts.amount)
  const shortId = opts.invoiceId.slice(-8).toUpperCase()
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e8e4;border-radius:6px;overflow:hidden;margin:20px 0;">
      <tr style="background:#f9f9f7;">
        <td style="padding:10px 16px;font-size:11px;font-weight:700;text-transform:uppercase;color:#999;letter-spacing:0.5px;">Invoice #</td>
        <td style="padding:10px 16px;font-size:11px;font-weight:700;text-transform:uppercase;color:#999;letter-spacing:0.5px;">Description</td>
        <td style="padding:10px 16px;font-size:11px;font-weight:700;text-transform:uppercase;color:#999;letter-spacing:0.5px;text-align:right;">Amount</td>
      </tr>
      <tr>
        <td style="padding:14px 16px;font-size:13px;color:#555;font-family:monospace;">${shortId}</td>
        <td style="padding:14px 16px;font-size:14px;color:#111;">${escapeHtml(opts.description)}</td>
        <td style="padding:14px 16px;font-size:18px;font-weight:700;color:#111827;text-align:right;">${fmtAmount}</td>
      </tr>
      ${opts.dueDate ? `<tr style="background:#fffbf0;"><td colspan="2" style="padding:10px 16px;font-size:13px;color:#92681a;">Due date</td><td style="padding:10px 16px;font-size:13px;color:#92681a;text-align:right;font-weight:600;">${new Date(opts.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>` : ''}
    </table>
    ${opts.notes ? `<p style="font-size:13px;color:#666;border-left:3px solid #e0e0e0;padding-left:12px;margin:16px 0;">${escapeHtml(opts.notes)}</p>` : ''}
  `
}

export function receiptCreatedEmail(opts: {
  clientName: string
  invoiceId: string
  description: string
  amount: number
  currency: string
  dueDate?: string | null
  notes?: string | null
  dashboardUrl?: string
}) {
  const name = opts.clientName.split(' ')[0] || opts.clientName
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">New payment receipt from HostMasters</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#555;">Dear ${escapeHtml(name)},</p>
    <p style="font-size:15px;color:#444;margin:0 0 8px;">Please find your invoice details below.</p>
    ${receiptTable(opts)}
    <p style="font-size:14px;color:#555;">You can view your account and invoices at any time through your owner portal.</p>
    ${safeUrl(opts.dashboardUrl) ? `<p style="margin:24px 0 0;"><a href="${opts.dashboardUrl}" style="display:inline-block;background:#C9A84C;color:#111827;font-weight:700;font-size:14px;padding:12px 24px;border-radius:6px;text-decoration:none;">View in portal</a></p>` : ''}
    <p style="margin:32px 0 0;font-size:14px;color:#777;">Thank you for your trust.<br>— The HostMasters Team</p>
  `
  return baseWrapper(body)
}

export function receiptPaidEmail(opts: {
  clientName: string
  invoiceId: string
  description: string
  amount: number
  currency: string
  paidAt?: string
  dashboardUrl?: string
}) {
  const name = opts.clientName.split(' ')[0] || opts.clientName
  const fmtAmount = new Intl.NumberFormat('en-IE', { style: 'currency', currency: opts.currency || 'EUR' }).format(opts.amount)
  const shortId = opts.invoiceId.slice(-8).toUpperCase()
  const paidDate = opts.paidAt ? new Date(opts.paidAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const body = `
    <div style="text-align:center;padding:8px 0 24px;">
      <div style="display:inline-block;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:50%;width:56px;height:56px;line-height:56px;font-size:28px;">✓</div>
      <h2 style="margin:16px 0 4px;font-size:22px;color:#111827;">Payment confirmed</h2>
      <p style="margin:0;font-size:15px;color:#555;">Thank you, ${escapeHtml(name)}</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;margin:0 0 24px;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0;font-size:13px;color:#16a34a;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Amount paid</p>
          <p style="margin:4px 0 0;font-size:28px;font-weight:700;color:#111827;">${fmtAmount}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#555;">Invoice #${shortId} · ${paidDate}</p>
        </td>
      </tr>
    </table>
    <p style="font-size:14px;color:#555;"><strong>Service:</strong> ${escapeHtml(opts.description)}</p>
    <p style="font-size:14px;color:#777;margin:24px 0 0;">We appreciate your continued partnership. Your property is in good hands.</p>
    ${safeUrl(opts.dashboardUrl) ? `<p style="margin:20px 0 0;"><a href="${opts.dashboardUrl}" style="display:inline-block;background:#111827;color:#fff;font-weight:600;font-size:14px;padding:11px 22px;border-radius:6px;text-decoration:none;">View your portal</a></p>` : ''}
    <p style="margin:32px 0 0;font-size:14px;color:#777;">Warm regards,<br>— The HostMasters Team</p>
  `
  return baseWrapper(body)
}

export function ownerStatementEmail(opts: {
  ownerName: string
  propertyName: string
  payoutId: string
  grossAmount: number
  commission: number
  commissionRate: number
  netAmount: number
  currency: string
  paidAt: string
  guestName: string
  checkIn: string
  checkOut: string
  platform?: string | null
  dashboardUrl?: string
}) {
  const name = opts.ownerName.split(' ')[0] || opts.ownerName
  const fmt = (n: number) => new Intl.NumberFormat('en-IE', { style: 'currency', currency: opts.currency || 'EUR' }).format(n)
  const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const shortId = opts.payoutId.slice(-8).toUpperCase()
  const platformLabel = opts.platform
    ? ({ AIRBNB: 'Airbnb', BOOKING: 'Booking.com', DIRECT: 'Direct booking', OTHER: 'Other' } as Record<string,string>)[opts.platform] ?? opts.platform
    : 'N/A'

  const body = `
    <h2 style="margin:0 0 4px;font-size:22px;color:#111827;">Owner Statement</h2>
    <p style="margin:0 0 24px;font-size:13px;color:#999;">Statement #${shortId} · Issued ${fmtDate(opts.paidAt)}</p>
    <p style="font-size:15px;color:#555;margin:0 0 24px;">Dear ${escapeHtml(name)},<br><br>Your payout for <strong>${escapeHtml(opts.propertyName)}</strong> has been processed. Please find the breakdown below.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e8e4;border-radius:6px;overflow:hidden;margin:0 0 24px;">
      <tr style="background:#f9f9f7;">
        <td colspan="2" style="padding:10px 16px;font-size:11px;font-weight:700;text-transform:uppercase;color:#999;letter-spacing:0.5px;">Reservation Details</td>
      </tr>
      <tr><td style="padding:10px 16px;font-size:13px;color:#777;width:40%;">Property</td><td style="padding:10px 16px;font-size:13px;color:#111;font-weight:600;">${escapeHtml(opts.propertyName)}</td></tr>
      <tr style="background:#fafafa;"><td style="padding:10px 16px;font-size:13px;color:#777;">Guest</td><td style="padding:10px 16px;font-size:13px;color:#111;">${escapeHtml(opts.guestName)}</td></tr>
      <tr><td style="padding:10px 16px;font-size:13px;color:#777;">Check-in</td><td style="padding:10px 16px;font-size:13px;color:#111;">${fmtDate(opts.checkIn)}</td></tr>
      <tr style="background:#fafafa;"><td style="padding:10px 16px;font-size:13px;color:#777;">Check-out</td><td style="padding:10px 16px;font-size:13px;color:#111;">${fmtDate(opts.checkOut)}</td></tr>
      <tr><td style="padding:10px 16px;font-size:13px;color:#777;">Platform</td><td style="padding:10px 16px;font-size:13px;color:#111;">${escapeHtml(platformLabel)}</td></tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e8e4;border-radius:6px;overflow:hidden;margin:0 0 24px;">
      <tr style="background:#f9f9f7;">
        <td colspan="2" style="padding:10px 16px;font-size:11px;font-weight:700;text-transform:uppercase;color:#999;letter-spacing:0.5px;">Financial Summary</td>
      </tr>
      <tr><td style="padding:10px 16px;font-size:14px;color:#444;">Gross rental income</td><td style="padding:10px 16px;font-size:14px;color:#111;text-align:right;">${fmt(opts.grossAmount)}</td></tr>
      <tr style="background:#fff8f0;"><td style="padding:10px 16px;font-size:14px;color:#92681a;">HostMasters commission (${opts.commissionRate}%)</td><td style="padding:10px 16px;font-size:14px;color:#92681a;text-align:right;">− ${fmt(opts.commission)}</td></tr>
      <tr style="background:#f0fdf4;border-top:2px solid #bbf7d0;">
        <td style="padding:14px 16px;font-size:15px;font-weight:700;color:#111827;">Net payout to you</td>
        <td style="padding:14px 16px;font-size:20px;font-weight:700;color:#16a34a;text-align:right;">${fmt(opts.netAmount)}</td>
      </tr>
    </table>

    <p style="font-size:13px;color:#777;">Payment was processed on <strong>${fmtDate(opts.paidAt)}</strong>. Funds should appear in your account within 1–3 business days depending on your bank.</p>
    ${safeUrl(opts.dashboardUrl) ? `<p style="margin:20px 0 0;"><a href="${opts.dashboardUrl}" style="display:inline-block;background:#111827;color:#fff;font-weight:600;font-size:14px;padding:11px 22px;border-radius:6px;text-decoration:none;">View in portal</a></p>` : ''}
    <p style="margin:32px 0 0;font-size:14px;color:#777;">Thank you for entrusting us with your property.<br>— The HostMasters Team</p>
  `
  return baseWrapper(body)
}

export function subscriptionReceiptEmail(opts: {
  clientName: string
  plan: string
  amount: number
  currency: string
  periodStart: string
  periodEnd: string
  invoiceId: string
  dashboardUrl?: string
}) {
  const name = opts.clientName.split(' ')[0] || opts.clientName
  const fmt = (n: number) => new Intl.NumberFormat('en-IE', { style: 'currency', currency: opts.currency || 'EUR' }).format(n)
  const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const shortId = opts.invoiceId.slice(-8).toUpperCase()
  const body = `
    <div style="text-align:center;padding:8px 0 24px;">
      <div style="display:inline-block;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:50%;width:56px;height:56px;line-height:56px;font-size:28px;">✓</div>
      <h2 style="margin:16px 0 4px;font-size:22px;color:#111827;">Thank you for your subscription</h2>
      <p style="margin:0;font-size:15px;color:#555;">Payment confirmed, ${escapeHtml(name)}</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e8e4;border-radius:6px;overflow:hidden;margin:0 0 24px;">
      <tr style="background:#f9f9f7;">
        <td colspan="2" style="padding:10px 16px;font-size:11px;font-weight:700;text-transform:uppercase;color:#999;letter-spacing:0.5px;">Invoice #${shortId}</td>
      </tr>
      <tr><td style="padding:10px 16px;font-size:13px;color:#777;">Plan</td><td style="padding:10px 16px;font-size:13px;font-weight:600;color:#111;">HostMasters ${escapeHtml(opts.plan)}</td></tr>
      <tr style="background:#fafafa;"><td style="padding:10px 16px;font-size:13px;color:#777;">Period</td><td style="padding:10px 16px;font-size:13px;color:#111;">${fmtDate(opts.periodStart)} – ${fmtDate(opts.periodEnd)}</td></tr>
      <tr><td style="padding:10px 16px;font-size:15px;font-weight:700;color:#111827;">Amount paid</td><td style="padding:10px 16px;font-size:18px;font-weight:700;color:#111827;text-align:right;">${fmt(opts.amount)}</td></tr>
    </table>
    <p style="font-size:14px;color:#555;">Your property management subscription is active. You have full access to your owner portal, reports, and our management team.</p>
    ${safeUrl(opts.dashboardUrl) ? `<p style="margin:20px 0 0;"><a href="${opts.dashboardUrl}" style="display:inline-block;background:#C9A84C;color:#111827;font-weight:700;font-size:14px;padding:12px 24px;border-radius:6px;text-decoration:none;">Go to my portal</a></p>` : ''}
    <p style="margin:32px 0 0;font-size:14px;color:#777;">We look forward to another great month.<br>— The HostMasters Team</p>
  `
  return baseWrapper(body)
}
