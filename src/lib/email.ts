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
