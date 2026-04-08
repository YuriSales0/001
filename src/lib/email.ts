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
