import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { sendSms, stayChatWelcomeSms } from '@/lib/sms'
import { stayChatUrl } from '@/lib/guest-stay/provision'

/**
 * POST /api/admin/stay-chats/[id]/resend-sms
 *
 * Manager/Admin can manually re-dispatch the welcome SMS to the guest.
 * Useful when the first SMS failed (Twilio down, wrong number corrected).
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const chat = await prisma.guestStayChat.findUnique({
    where: { id: params.id },
    include: {
      reservation: { select: { guestName: true, guestPhone: true, guestLanguage: true } },
      property: { select: { name: true } },
      client: { select: { managerId: true } },
    },
  })
  if (!chat) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (guard.user!.role === 'MANAGER' && chat.client.managerId !== guard.user!.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!chat.reservation.guestPhone) {
    return NextResponse.json({ error: 'Reservation has no phone number' }, { status: 400 })
  }

  // Rate limit: max 3 SMS resends per chat per hour (anti-spam)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const recentResends = await prisma.guestStayMessage.count({
    where: {
      chatId: chat.id,
      author: 'SYSTEM',
      content: { contains: 'SMS resent by' },
      createdAt: { gte: oneHourAgo },
    },
  })
  if (recentResends >= 3) {
    return NextResponse.json(
      { error: 'SMS resend limit reached (3/hour). Contact the guest via another channel.' },
      { status: 429 },
    )
  }

  const url = stayChatUrl(chat.token)
  const body = stayChatWelcomeSms(
    chat.reservation.guestLanguage ?? chat.language,
    chat.reservation.guestName,
    chat.property.name,
    url,
  )

  const result = await sendSms({ to: chat.reservation.guestPhone, body })

  await prisma.guestStayMessage.create({
    data: {
      chatId: chat.id,
      author: 'SYSTEM',
      content: result.ok
        ? `SMS resent by ${guard.user!.role.toLowerCase()}`
        : `SMS resend failed (${result.error}) — delivered manually`,
    },
  })

  return NextResponse.json(result)
}
