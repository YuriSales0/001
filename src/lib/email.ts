import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY || 'placeholder')

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  return resend.emails.send({
    from: process.env.EMAIL_FROM || 'Hostmaster <noreply@hostmaster.es>',
    to,
    subject,
    html,
  })
}

export function newBookingEmail(guestName: string, propertyName: string, checkIn: string, checkOut: string) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e3a5f;">New Booking Received</h2>
      <p>A new reservation has been made:</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px; font-weight: bold;">Property:</td><td style="padding: 8px;">${propertyName}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Guest:</td><td style="padding: 8px;">${guestName}</td></tr>
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
      <p><strong>${guestName}</strong> is checking out of <strong>${propertyName}</strong> tomorrow (${checkoutDate}).</p>
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
        <h2 style="color: #1A1A1A; margin: 0;">Visit completed at ${propertyName}</h2>
        <p style="color: #777; margin: 4px 0 0 0; font-size: 13px;">${taskTitle} · ${taskType.replace(/_/g, ' ').toLowerCase()}</p>
      </div>
      ${conditionLabel ? `<p><strong>Status:</strong> ${conditionLabel}</p>` : ''}
      ${issues ? `<p><strong>Notes from our team:</strong><br/>${issues.replace(/\n/g, '<br/>')}</p>` : ''}
      ${notes ? `<p style="color: #555;">${notes.replace(/\n/g, '<br/>')}</p>` : ''}
      <p style="margin-top: 24px;">You can view the full report in your dashboard at any time.</p>
      <p style="color: #999; margin-top: 24px; font-size: 12px;">— HostMasters · Costa Tropical, Spain</p>
    </div>
  `
}

export function monthlyReportEmail(propertyName: string, month: string, year: number) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e3a5f;">Monthly Report Available</h2>
      <p>Your monthly report for <strong>${propertyName}</strong> (${month} ${year}) is now available.</p>
      <p>Log in to your dashboard to view and download the full report.</p>
      <p style="color: #666; margin-top: 20px;">— Hostmaster Team</p>
    </div>
  `
}

function baseWrapper(content: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f0;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f0;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
<tr><td style="background:#111827;padding:20px 32px;">
  <span style="font-size:20px;font-weight:700;color:#fff;letter-spacing:-0.5px;">Host<span style="color:#C9A84C;">Masters</span></span>
</td></tr>
<tr><td style="padding:32px;">${content}</td></tr>
<tr><td style="padding:16px 32px;border-top:1px solid #eee;font-size:11px;color:#999;">
  HostMasters · Costa Tropical, Spain · <a href="https://hostmasters.es" style="color:#C9A84C;">hostmasters.es</a>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`
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
  platform: string | null
  dashboardUrl: string
}) {
  const fmt = (n: number) => `${opts.currency} ${n.toFixed(2)}`
  const fmtD = (s: string) => new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const content = `
    <h2 style="margin:0 0 4px;color:#111827;font-size:20px;">Owner Statement</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:13px;">Payment processed on ${fmtD(opts.paidAt)}</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Property</td><td style="padding:8px 0;font-weight:600;text-align:right;">${opts.propertyName}</td></tr>
      ${opts.guestName !== '—' ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Guest</td><td style="padding:8px 0;text-align:right;">${opts.guestName}</td></tr>` : ''}
      ${opts.guestName !== '—' ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Stay</td><td style="padding:8px 0;text-align:right;">${fmtD(opts.checkIn)} – ${fmtD(opts.checkOut)}</td></tr>` : ''}
      ${opts.platform ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Platform</td><td style="padding:8px 0;text-align:right;">${opts.platform}</td></tr>` : ''}
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:24px;">
      <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Gross amount</td><td style="padding:6px 0;text-align:right;">${fmt(opts.grossAmount)}</td></tr>
      <tr><td style="padding:6px 0;color:#f97316;font-size:13px;">Commission (${opts.commissionRate}%)</td><td style="padding:6px 0;color:#f97316;text-align:right;">− ${fmt(opts.commission)}</td></tr>
      <tr style="border-top:1px solid #e5e7eb;"><td style="padding:10px 0 6px;font-weight:700;font-size:15px;">Net payout</td><td style="padding:10px 0 6px;font-weight:700;font-size:15px;text-align:right;color:#16a34a;">${fmt(opts.netAmount)}</td></tr>
    </table>
    <p style="margin:0 0 8px;"><a href="${opts.dashboardUrl}" style="display:inline-block;background:#111827;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;">View in Dashboard</a></p>
  `
  return baseWrapper(content)
}

export function invoicePaidEmail(opts: {
  clientName: string
  invoiceId: string
  description: string
  amount: number
  currency: string
  paidAt: string
  dashboardUrl: string
}) {
  const fmt = (n: number) => `${opts.currency} ${n.toFixed(2)}`
  const fmtD = (s: string) => new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const content = `
    <h2 style="margin:0 0 4px;color:#111827;font-size:20px;">Payment Confirmed</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:13px;">Hi ${opts.clientName}, your payment has been processed.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:8px;padding:16px;margin-bottom:24px;">
      <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Description</td><td style="padding:6px 0;text-align:right;font-size:13px;">${opts.description}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Date</td><td style="padding:6px 0;text-align:right;">${fmtD(opts.paidAt)}</td></tr>
      <tr style="border-top:1px solid #bbf7d0;"><td style="padding:10px 0 6px;font-weight:700;font-size:15px;">Amount paid</td><td style="padding:10px 0 6px;font-weight:700;font-size:15px;text-align:right;color:#16a34a;">${fmt(opts.amount)}</td></tr>
    </table>
    <p style="margin:0 0 8px;"><a href="${opts.dashboardUrl}" style="display:inline-block;background:#111827;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;">View Invoice</a></p>
  `
  return baseWrapper(content)
}

export function invoiceCreatedEmail(opts: {
  clientName: string
  invoiceId: string
  description: string
  amount: number
  currency: string
  dueDate?: string
  dashboardUrl: string
}) {
  const fmt = (n: number) => `${opts.currency} ${n.toFixed(2)}`
  const fmtD = (s: string) => new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const content = `
    <h2 style="margin:0 0 4px;color:#111827;font-size:20px;">New Invoice</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:13px;">Hi ${opts.clientName}, a new invoice has been issued for you.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:24px;">
      <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Description</td><td style="padding:6px 0;text-align:right;font-size:13px;">${opts.description}</td></tr>
      ${opts.dueDate ? `<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Due date</td><td style="padding:6px 0;text-align:right;">${fmtD(opts.dueDate)}</td></tr>` : ''}
      <tr style="border-top:1px solid #e5e7eb;"><td style="padding:10px 0 6px;font-weight:700;font-size:15px;">Amount due</td><td style="padding:10px 0 6px;font-weight:700;font-size:15px;text-align:right;">${fmt(opts.amount)}</td></tr>
    </table>
    <p style="margin:0 0 8px;"><a href="${opts.dashboardUrl}" style="display:inline-block;background:#111827;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;">View Invoice</a></p>
  `
  return baseWrapper(content)
}

export function subscriptionInvoiceEmail(opts: {
  clientName: string
  invoiceId: string
  planName: string
  amount: number
  currency: string
  periodStart: string
  periodEnd: string
  paidAt: string
  dashboardUrl: string
}) {
  const fmt = (n: number) => `${opts.currency} ${n.toFixed(2)}`
  const fmtD = (s: string) => new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const content = `
    <h2 style="margin:0 0 4px;color:#111827;font-size:20px;">Subscription Renewed</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:13px;">Hi ${opts.clientName}, your HostMasters subscription has been renewed.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:8px;padding:16px;margin-bottom:24px;">
      <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Plan</td><td style="padding:6px 0;text-align:right;font-weight:600;">${opts.planName}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Period</td><td style="padding:6px 0;text-align:right;">${fmtD(opts.periodStart)} – ${fmtD(opts.periodEnd)}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Date</td><td style="padding:6px 0;text-align:right;">${fmtD(opts.paidAt)}</td></tr>
      <tr style="border-top:1px solid #bbf7d0;"><td style="padding:10px 0 6px;font-weight:700;font-size:15px;">Amount charged</td><td style="padding:10px 0 6px;font-weight:700;font-size:15px;text-align:right;color:#16a34a;">${fmt(opts.amount)}</td></tr>
    </table>
    <p style="margin:0 0 8px;"><a href="${opts.dashboardUrl}" style="display:inline-block;background:#111827;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;">View Dashboard</a></p>
  `
  return baseWrapper(content)
}
