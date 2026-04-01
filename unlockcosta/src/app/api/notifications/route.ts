import { NextRequest, NextResponse } from 'next/server'
import {
  sendEmail,
  newBookingEmail,
  checkoutReminderEmail,
  monthlyReportEmail,
} from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    if (!type || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: type, data' },
        { status: 400 }
      )
    }

    switch (type) {
      case 'new_booking': {
        const { ownerEmail, guestName, propertyName, checkIn, checkOut } = data

        if (!ownerEmail || !guestName || !propertyName || !checkIn || !checkOut) {
          return NextResponse.json(
            { error: 'Missing data fields for new_booking notification' },
            { status: 400 }
          )
        }

        await sendEmail({
          to: ownerEmail,
          subject: `New Booking: ${propertyName}`,
          html: newBookingEmail(guestName, propertyName, checkIn, checkOut),
        })

        return NextResponse.json({ message: 'New booking notification sent' })
      }

      case 'checkout_reminder': {
        const { ownerEmail, guestName, propertyName, checkoutDate } = data

        if (!ownerEmail || !guestName || !propertyName || !checkoutDate) {
          return NextResponse.json(
            { error: 'Missing data fields for checkout_reminder notification' },
            { status: 400 }
          )
        }

        await sendEmail({
          to: ownerEmail,
          subject: `Checkout Tomorrow: ${propertyName}`,
          html: checkoutReminderEmail(guestName, propertyName, checkoutDate),
        })

        return NextResponse.json({ message: 'Checkout reminder sent' })
      }

      case 'monthly_report': {
        const { ownerEmail, propertyName, month, year } = data

        if (!ownerEmail || !propertyName || !month || !year) {
          return NextResponse.json(
            { error: 'Missing data fields for monthly_report notification' },
            { status: 400 }
          )
        }

        await sendEmail({
          to: ownerEmail,
          subject: `Monthly Report: ${propertyName} - ${month} ${year}`,
          html: monthlyReportEmail(propertyName, month, year),
        })

        return NextResponse.json({ message: 'Monthly report notification sent' })
      }

      default:
        return NextResponse.json(
          { error: `Unknown notification type: ${type}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error sending notification:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}
