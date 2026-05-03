import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { priorityOf } from '@/lib/notifications'
import {
  sendEmail,
  newBookingEmail,
  checkoutReminderEmail,
  monthlyReportEmail,
} from '@/lib/email'
import {
  normalizeEmailLocale,
  newBookingI18n,
  checkoutReminderI18n,
  monthlyReportReadyI18n,
} from '@/lib/email-i18n'

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

  // Pull more rows than `limit` so we can re-sort by priority and still
  // return the requested page size; cap pulled at 200 for safety.
  const pullLimit = Math.min(limit * 3, 200)
  const [raw, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: pullLimit,
    }),
    prisma.notification.count({
      where: { userId: me.id, read: false },
    }),
  ])

  // Sort: unread first (highest priority anywhere), then priority desc, then createdAt desc
  const notifications = raw
    .map(n => ({ ...n, priority: priorityOf(n.type) }))
    .sort((a, b) => {
      // unread before read
      if (a.read !== b.read) return a.read ? 1 : -1
      // higher priority first
      if (b.priority !== a.priority) return b.priority - a.priority
      // newer first
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    .slice(0, limit)

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
        const { ownerEmail, guestName, propertyName, checkIn, checkOut, language } = data
        if (!ownerEmail || !guestName || !propertyName || !checkIn || !checkOut) {
          return NextResponse.json({ error: 'Missing data fields for new_booking' }, { status: 400 })
        }
        // Resolve owner locale: from body.language → DB user.language → 'en'
        let loc = normalizeEmailLocale(language)
        if (!language) {
          const owner = await prisma.user.findUnique({ where: { email: ownerEmail }, select: { language: true } }).catch(() => null)
          if (owner) loc = normalizeEmailLocale(owner.language)
        }
        await sendEmail({
          to: ownerEmail,
          subject: newBookingI18n.subject(loc, propertyName),
          html: newBookingEmail(guestName, propertyName, checkIn, checkOut, loc),
        })
        return NextResponse.json({ message: 'New booking notification sent' })
      }
      case 'checkout_reminder': {
        const { ownerEmail, guestName, propertyName, checkoutDate, language } = data
        if (!ownerEmail || !guestName || !propertyName || !checkoutDate) {
          return NextResponse.json({ error: 'Missing data fields for checkout_reminder' }, { status: 400 })
        }
        let loc = normalizeEmailLocale(language)
        if (!language) {
          const owner = await prisma.user.findUnique({ where: { email: ownerEmail }, select: { language: true } }).catch(() => null)
          if (owner) loc = normalizeEmailLocale(owner.language)
        }
        await sendEmail({
          to: ownerEmail,
          subject: checkoutReminderI18n.subject(loc, propertyName),
          html: checkoutReminderEmail(guestName, propertyName, checkoutDate, loc),
        })
        return NextResponse.json({ message: 'Checkout reminder sent' })
      }
      case 'monthly_report': {
        const { ownerEmail, propertyName, month, year, language } = data
        if (!ownerEmail || !propertyName || !month || !year) {
          return NextResponse.json({ error: 'Missing data fields for monthly_report' }, { status: 400 })
        }
        let loc = normalizeEmailLocale(language)
        if (!language) {
          const owner = await prisma.user.findUnique({ where: { email: ownerEmail }, select: { language: true } }).catch(() => null)
          if (owner) loc = normalizeEmailLocale(owner.language)
        }
        await sendEmail({
          to: ownerEmail,
          subject: monthlyReportReadyI18n.subject(loc, propertyName, month, year),
          html: monthlyReportEmail(propertyName, month, year, loc),
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
