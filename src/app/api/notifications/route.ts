import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import {
  sendEmail,
  newBookingEmail,
  checkoutReminderEmail,
  monthlyReportEmail,
} from '@/lib/email'

export const dynamic = 'force-dynamic'

/**
 * GET /api/notifications — list user's in-app notifications
 * ?unread=true — only unread
 * ?limit=N — default 30
 */
export async function GET(req: NextRequest) {
  const guard = await requireRole(['ADMIN', 'MANAGER', 'CREW', 'CLIENT'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const { searchParams } = new URL(req.url)
  const unreadOnly = searchParams.get('unread') === 'true'
  const limit = Math.min(Number(searchParams.get('limit')) || 30, 100)

  const where: Record<string, unknown> = { userId: me.id }
  if (unreadOnly) where.read = false

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    prisma.notification.count({
      where: { userId: me.id, read: false },
    }),
  ])

  return NextResponse.json({ notifications, unreadCount })
}

/**
 * PATCH /api/notifications — mark as read
 * Body: { ids: string[] } or { all: true }
 */
export async function PATCH(req: NextRequest) {
  const guard = await requireRole(['ADMIN', 'MANAGER', 'CREW', 'CLIENT'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const now = new Date()

  if (body.all === true) {
    await prisma.notification.updateMany({
      where: { userId: me.id, read: false },
      data: { read: true, readAt: now },
    })
    return NextResponse.json({ ok: true })
  }

  if (Array.isArray(body.ids) && body.ids.length > 0) {
    await prisma.notification.updateMany({
      where: { id: { in: body.ids }, userId: me.id },
      data: { read: true, readAt: now },
    })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Provide { ids: [...] } or { all: true }' }, { status: 400 })
}

/**
 * POST /api/notifications — send email notifications (legacy endpoint)
 */
export async function POST(request: NextRequest) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let body: any
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    const { type, data } = body

    if (!type || !data) {
      return NextResponse.json({ error: 'Missing required fields: type, data' }, { status: 400 })
    }

    switch (type) {
      case 'new_booking': {
        const { ownerEmail, guestName, propertyName, checkIn, checkOut } = data
        if (!ownerEmail || !guestName || !propertyName || !checkIn || !checkOut) {
          return NextResponse.json({ error: 'Missing data fields for new_booking' }, { status: 400 })
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
          return NextResponse.json({ error: 'Missing data fields for checkout_reminder' }, { status: 400 })
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
          return NextResponse.json({ error: 'Missing data fields for monthly_report' }, { status: 400 })
        }
        await sendEmail({
          to: ownerEmail,
          subject: `Monthly Report: ${propertyName} - ${month} ${year}`,
          html: monthlyReportEmail(propertyName, month, year),
        })
        return NextResponse.json({ message: 'Monthly report notification sent' })
      }
      default:
        return NextResponse.json({ error: `Unknown notification type: ${type}` }, { status: 400 })
    }
  } catch (error) {
    console.error('Error sending notification:', error)
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}
