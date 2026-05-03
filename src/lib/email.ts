import { Resend } from 'resend'
import {
  type EmailLocale,
  fmtMoney,
  fmtDate,
  wrapperFooter,
  teamSignoff,
  dearLabel,
  monthlyStatementI18n,
  ownerStatementI18n,
  subscriptionReceiptI18n,
  taskCompletedI18n,
  receiptCreatedI18n,
  receiptPaidI18n,
} from './email-i18n'

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
  locale?: EmailLocale
}) {
  const { propertyName, taskTitle, taskType, condition, issues, notes } = opts
  const loc = opts.locale ?? 'en'
  const t = taskCompletedI18n
  const conditionLabel = condition === 'good' ? t.conditionGood[loc]
    : condition === 'minor' ? t.conditionMinor[loc]
    : condition === 'major' ? t.conditionMajor[loc]
    : ''
  return `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1A1A1A;">
      <div style="border-bottom: 2px solid #C9A84C; padding-bottom: 12px; margin-bottom: 24px;">
        <h2 style="color: #1A1A1A; margin: 0;">${t.titlePrefix[loc]} ${escapeHtml(propertyName)}</h2>
        <p style="color: #777; margin: 4px 0 0 0; font-size: 13px;">${escapeHtml(taskTitle)} · ${escapeHtml(taskType.replace(/_/g, ' ').toLowerCase())}</p>
      </div>
      ${conditionLabel ? `<p><strong>${t.status[loc]}</strong> ${escapeHtml(conditionLabel)}</p>` : ''}
      ${issues ? `<p><strong>${t.notesLabel[loc]}</strong><br/>${escapeHtml(issues).replace(/\n/g, '<br/>')}</p>` : ''}
      ${notes ? `<p style="color: #555;">${escapeHtml(notes).replace(/\n/g, '<br/>')}</p>` : ''}
      <p style="margin-top: 24px;">${t.fullReport[loc]}</p>
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
  locale?: EmailLocale
}) {
  const loc = opts.locale ?? 'en'
  const name = opts.ownerName.split(' ')[0] || opts.ownerName
  const fmt = (n: number) => fmtMoney(n, loc)
  const t = monthlyStatementI18n
  const monthYear = `${opts.month} ${opts.year}`
  const body = `
    <h2 style="margin:0 0 4px;font-size:22px;color:#111827;">${t.title[loc]}</h2>
    <p style="margin:0 0 24px;font-size:13px;color:#999;">${escapeHtml(opts.month)} ${opts.year} · ${escapeHtml(opts.propertyName)}</p>
    <p style="font-size:15px;color:#555;margin:0 0 24px;">${dearLabel[loc]} ${escapeHtml(name)},<br><br>${t.introHere(loc, escapeHtml(opts.propertyName), escapeHtml(monthYear))}</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e8e4;border-radius:6px;overflow:hidden;margin:0 0 24px;">
      <tr style="background:#f9f9f7;">
        <td colspan="2" style="padding:10px 16px;font-size:11px;font-weight:700;text-transform:uppercase;color:#999;letter-spacing:0.5px;">${t.summary[loc]}</td>
      </tr>
      <tr><td style="padding:10px 16px;font-size:14px;color:#444;">${t.reservations[loc]}</td><td style="padding:10px 16px;font-size:14px;color:#111;text-align:right;">${opts.reservationCount}</td></tr>
      <tr style="background:#fafafa;"><td style="padding:10px 16px;font-size:14px;color:#444;">${t.grossRental[loc]}</td><td style="padding:10px 16px;font-size:14px;color:#111;text-align:right;font-weight:600;">${fmt(opts.grossRevenue)}</td></tr>
      <tr><td style="padding:10px 16px;font-size:14px;color:#444;">${t.expenses[loc]}</td><td style="padding:10px 16px;font-size:14px;color:#c0392b;text-align:right;">− ${fmt(opts.totalExpenses)}</td></tr>
      <tr style="background:#fff8f0;"><td style="padding:10px 16px;font-size:14px;color:#92681a;">${t.hmCommission(loc, opts.commissionRate)}</td><td style="padding:10px 16px;font-size:14px;color:#92681a;text-align:right;">− ${fmt(opts.commission)}</td></tr>
      <tr style="background:#f0fdf4;border-top:2px solid #bbf7d0;">
        <td style="padding:14px 16px;font-size:15px;font-weight:700;color:#111827;">${t.netPayout[loc]}</td>
        <td style="padding:14px 16px;font-size:20px;font-weight:700;color:#16a34a;text-align:right;">${fmt(opts.ownerPayout)}</td>
      </tr>
    </table>

    ${opts.grossRevenue === 0
      ? `<p style="font-size:14px;color:#888;text-align:center;padding:16px;background:#fafafa;border-radius:6px;">${t.noReservations[loc]}</p>`
      : ''
    }

    ${safeUrl(opts.dashboardUrl) ? `<p style="margin:20px 0 0;"><a href="${opts.dashboardUrl}" style="display:inline-block;background:#111827;color:#fff;font-weight:600;font-size:14px;padding:11px 22px;border-radius:6px;text-decoration:none;">${t.cta[loc]}</a></p>` : ''}
    <p style="margin:32px 0 0;font-size:14px;color:#777;">${t.thanks[loc]}<br>${teamSignoff[loc]}</p>
  `
  return baseWrapper(body, loc)
}

// ─── Finance emails ────────────────────────────────────────────────────────────

function baseWrapper(content: string, locale: EmailLocale = 'en') {
  return `<!DOCTYPE html>
<html lang="${locale}">
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
            <p style="margin:4px 0 0;font-size:12px;color:#bbb;">${wrapperFooter[locale]}</p>
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
  locale?: EmailLocale
}) {
  const loc = opts.locale ?? 'en'
  const t = receiptCreatedI18n
  const fmtAmount = fmtMoney(opts.amount, loc, opts.currency || 'EUR')
  const shortId = opts.invoiceId.slice(-8).toUpperCase()
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e8e4;border-radius:6px;overflow:hidden;margin:20px 0;">
      <tr style="background:#f9f9f7;">
        <td style="padding:10px 16px;font-size:11px;font-weight:700;text-transform:uppercase;color:#999;letter-spacing:0.5px;">${t.invoiceCol[loc]}</td>
        <td style="padding:10px 16px;font-size:11px;font-weight:700;text-transform:uppercase;color:#999;letter-spacing:0.5px;">${t.descriptionCol[loc]}</td>
        <td style="padding:10px 16px;font-size:11px;font-weight:700;text-transform:uppercase;color:#999;letter-spacing:0.5px;text-align:right;">${t.amountCol[loc]}</td>
      </tr>
      <tr>
        <td style="padding:14px 16px;font-size:13px;color:#555;font-family:monospace;">${shortId}</td>
        <td style="padding:14px 16px;font-size:14px;color:#111;">${escapeHtml(opts.description)}</td>
        <td style="padding:14px 16px;font-size:18px;font-weight:700;color:#111827;text-align:right;">${fmtAmount}</td>
      </tr>
      ${opts.dueDate ? `<tr style="background:#fffbf0;"><td colspan="2" style="padding:10px 16px;font-size:13px;color:#92681a;">${t.dueDate[loc]}</td><td style="padding:10px 16px;font-size:13px;color:#92681a;text-align:right;font-weight:600;">${fmtDate(opts.dueDate, loc)}</td></tr>` : ''}
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
  locale?: EmailLocale
}) {
  const loc = opts.locale ?? 'en'
  const name = opts.clientName.split(' ')[0] || opts.clientName
  const t = receiptCreatedI18n
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">${t.title[loc]}</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#555;">${dearLabel[loc]} ${escapeHtml(name)},</p>
    <p style="font-size:15px;color:#444;margin:0 0 8px;">${t.intro[loc]}</p>
    ${receiptTable({ ...opts, locale: loc })}
    <p style="font-size:14px;color:#555;">${t.portalAccess[loc]}</p>
    ${safeUrl(opts.dashboardUrl) ? `<p style="margin:24px 0 0;"><a href="${opts.dashboardUrl}" style="display:inline-block;background:#C9A84C;color:#111827;font-weight:700;font-size:14px;padding:12px 24px;border-radius:6px;text-decoration:none;">${t.cta[loc]}</a></p>` : ''}
    <p style="margin:32px 0 0;font-size:14px;color:#777;">${t.thanks[loc]}<br>${teamSignoff[loc]}</p>
  `
  return baseWrapper(body, loc)
}

export function receiptPaidEmail(opts: {
  clientName: string
  invoiceId: string
  description: string
  amount: number
  currency: string
  paidAt?: string
  dashboardUrl?: string
  locale?: EmailLocale
}) {
  const loc = opts.locale ?? 'en'
  const name = opts.clientName.split(' ')[0] || opts.clientName
  const t = receiptPaidI18n
  const fmtAmount = fmtMoney(opts.amount, loc, opts.currency || 'EUR')
  const shortId = opts.invoiceId.slice(-8).toUpperCase()
  const paidDate = fmtDate(opts.paidAt ?? new Date().toISOString(), loc)
  const body = `
    <div style="text-align:center;padding:8px 0 24px;">
      <div style="display:inline-block;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:50%;width:56px;height:56px;line-height:56px;font-size:28px;">✓</div>
      <h2 style="margin:16px 0 4px;font-size:22px;color:#111827;">${t.title[loc]}</h2>
      <p style="margin:0;font-size:15px;color:#555;">${t.thanksName(loc, escapeHtml(name))}</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;margin:0 0 24px;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0;font-size:13px;color:#16a34a;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">${t.amountPaid[loc]}</p>
          <p style="margin:4px 0 0;font-size:28px;font-weight:700;color:#111827;">${fmtAmount}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#555;">${t.invoiceLabel(loc, shortId)} · ${paidDate}</p>
        </td>
      </tr>
    </table>
    <p style="font-size:14px;color:#555;"><strong>${t.service[loc]}</strong> ${escapeHtml(opts.description)}</p>
    <p style="font-size:14px;color:#777;margin:24px 0 0;">${t.appreciation[loc]}</p>
    ${safeUrl(opts.dashboardUrl) ? `<p style="margin:20px 0 0;"><a href="${opts.dashboardUrl}" style="display:inline-block;background:#111827;color:#fff;font-weight:600;font-size:14px;padding:11px 22px;border-radius:6px;text-decoration:none;">${t.cta[loc]}</a></p>` : ''}
    <p style="margin:32px 0 0;font-size:14px;color:#777;">${t.warmRegards[loc]}<br>${teamSignoff[loc]}</p>
  `
  return baseWrapper(body, loc)
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
  locale?: EmailLocale
}) {
  const loc = opts.locale ?? 'en'
  const name = opts.ownerName.split(' ')[0] || opts.ownerName
  const t = ownerStatementI18n
  const fmt = (n: number) => fmtMoney(n, loc, opts.currency || 'EUR')
  const dt = (s: string) => fmtDate(s, loc)
  const shortId = opts.payoutId.slice(-8).toUpperCase()
  const platformLabel = opts.platform
    ? ({ AIRBNB: 'Airbnb', BOOKING: 'Booking.com', DIRECT: t.platformDirect[loc], OTHER: t.platformOther[loc] } as Record<string,string>)[opts.platform] ?? opts.platform
    : 'N/A'

  const body = `
    <h2 style="margin:0 0 4px;font-size:22px;color:#111827;">${t.title[loc]}</h2>
    <p style="margin:0 0 24px;font-size:13px;color:#999;">${t.issued(loc, shortId, dt(opts.paidAt))}</p>
    <p style="font-size:15px;color:#555;margin:0 0 24px;">${dearLabel[loc]} ${escapeHtml(name)},<br><br>${t.intro(loc, escapeHtml(opts.propertyName))}</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e8e4;border-radius:6px;overflow:hidden;margin:0 0 24px;">
      <tr style="background:#f9f9f7;">
        <td colspan="2" style="padding:10px 16px;font-size:11px;font-weight:700;text-transform:uppercase;color:#999;letter-spacing:0.5px;">${t.reservationDetails[loc]}</td>
      </tr>
      <tr><td style="padding:10px 16px;font-size:13px;color:#777;width:40%;">${t.property[loc]}</td><td style="padding:10px 16px;font-size:13px;color:#111;font-weight:600;">${escapeHtml(opts.propertyName)}</td></tr>
      <tr style="background:#fafafa;"><td style="padding:10px 16px;font-size:13px;color:#777;">${t.guest[loc]}</td><td style="padding:10px 16px;font-size:13px;color:#111;">${escapeHtml(opts.guestName)}</td></tr>
      <tr><td style="padding:10px 16px;font-size:13px;color:#777;">${t.checkIn[loc]}</td><td style="padding:10px 16px;font-size:13px;color:#111;">${dt(opts.checkIn)}</td></tr>
      <tr style="background:#fafafa;"><td style="padding:10px 16px;font-size:13px;color:#777;">${t.checkOut[loc]}</td><td style="padding:10px 16px;font-size:13px;color:#111;">${dt(opts.checkOut)}</td></tr>
      <tr><td style="padding:10px 16px;font-size:13px;color:#777;">${t.platform[loc]}</td><td style="padding:10px 16px;font-size:13px;color:#111;">${escapeHtml(platformLabel)}</td></tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e8e4;border-radius:6px;overflow:hidden;margin:0 0 24px;">
      <tr style="background:#f9f9f7;">
        <td colspan="2" style="padding:10px 16px;font-size:11px;font-weight:700;text-transform:uppercase;color:#999;letter-spacing:0.5px;">${t.financialSummary[loc]}</td>
      </tr>
      <tr><td style="padding:10px 16px;font-size:14px;color:#444;">${t.grossRental[loc]}</td><td style="padding:10px 16px;font-size:14px;color:#111;text-align:right;">${fmt(opts.grossAmount)}</td></tr>
      <tr style="background:#fff8f0;"><td style="padding:10px 16px;font-size:14px;color:#92681a;">${t.hmCommission(loc, opts.commissionRate)}</td><td style="padding:10px 16px;font-size:14px;color:#92681a;text-align:right;">− ${fmt(opts.commission)}</td></tr>
      <tr style="background:#f0fdf4;border-top:2px solid #bbf7d0;">
        <td style="padding:14px 16px;font-size:15px;font-weight:700;color:#111827;">${t.netPayout[loc]}</td>
        <td style="padding:14px 16px;font-size:20px;font-weight:700;color:#16a34a;text-align:right;">${fmt(opts.netAmount)}</td>
      </tr>
    </table>

    <p style="font-size:13px;color:#777;">${t.paymentProcessed(loc, dt(opts.paidAt))}</p>
    ${safeUrl(opts.dashboardUrl) ? `<p style="margin:20px 0 0;"><a href="${opts.dashboardUrl}" style="display:inline-block;background:#111827;color:#fff;font-weight:600;font-size:14px;padding:11px 22px;border-radius:6px;text-decoration:none;">${t.cta[loc]}</a></p>` : ''}
    <p style="margin:32px 0 0;font-size:14px;color:#777;">${t.thanks[loc]}<br>${teamSignoff[loc]}</p>
  `
  return baseWrapper(body, loc)
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
  locale?: EmailLocale
}) {
  const loc = opts.locale ?? 'en'
  const name = opts.clientName.split(' ')[0] || opts.clientName
  const t = subscriptionReceiptI18n
  const fmt = (n: number) => fmtMoney(n, loc, opts.currency || 'EUR')
  const dt = (s: string) => fmtDate(s, loc)
  const shortId = opts.invoiceId.slice(-8).toUpperCase()
  const body = `
    <div style="text-align:center;padding:8px 0 24px;">
      <div style="display:inline-block;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:50%;width:56px;height:56px;line-height:56px;font-size:28px;">✓</div>
      <h2 style="margin:16px 0 4px;font-size:22px;color:#111827;">${t.title[loc]}</h2>
      <p style="margin:0;font-size:15px;color:#555;">${t.paymentConfirmed(loc, escapeHtml(name))}</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e8e4;border-radius:6px;overflow:hidden;margin:0 0 24px;">
      <tr style="background:#f9f9f7;">
        <td colspan="2" style="padding:10px 16px;font-size:11px;font-weight:700;text-transform:uppercase;color:#999;letter-spacing:0.5px;">${t.invoiceLabel(loc, shortId)}</td>
      </tr>
      <tr><td style="padding:10px 16px;font-size:13px;color:#777;">${t.plan[loc]}</td><td style="padding:10px 16px;font-size:13px;font-weight:600;color:#111;">HostMasters ${escapeHtml(opts.plan)}</td></tr>
      <tr style="background:#fafafa;"><td style="padding:10px 16px;font-size:13px;color:#777;">${t.period[loc]}</td><td style="padding:10px 16px;font-size:13px;color:#111;">${dt(opts.periodStart)} – ${dt(opts.periodEnd)}</td></tr>
      <tr><td style="padding:10px 16px;font-size:15px;font-weight:700;color:#111827;">${t.amountPaid[loc]}</td><td style="padding:10px 16px;font-size:18px;font-weight:700;color:#111827;text-align:right;">${fmt(opts.amount)}</td></tr>
    </table>
    <p style="font-size:14px;color:#555;">${t.active[loc]}</p>
    ${safeUrl(opts.dashboardUrl) ? `<p style="margin:20px 0 0;"><a href="${opts.dashboardUrl}" style="display:inline-block;background:#C9A84C;color:#111827;font-weight:700;font-size:14px;padding:12px 24px;border-radius:6px;text-decoration:none;">${t.cta[loc]}</a></p>` : ''}
    <p style="margin:32px 0 0;font-size:14px;color:#777;">${t.closing[loc]}<br>${teamSignoff[loc]}</p>
  `
  return baseWrapper(body, loc)
}
