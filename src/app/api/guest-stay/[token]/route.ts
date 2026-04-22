import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/guest-stay/[token]
 * Public endpoint (token-based) — load chat history + property context.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } },
) {
  const chat = await prisma.guestStayChat.findUnique({
    where: { token: params.token },
    include: {
      property: { select: { name: true, city: true, address: true } },
      reservation: { select: { guestName: true, checkIn: true, checkOut: true } },
      messages: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          author: true,
          content: true,
          aiTopicTag: true,
          createdAt: true,
        },
      },
    },
  })

  if (!chat) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Token is valid only during stay + 24h after checkout.
  // Return 404 (not 410) on expiry to avoid confirming token existence
  // to an attacker probing with expired/random tokens.
  const now = new Date()
  const expiresAt = new Date(chat.reservation.checkOut.getTime() + 24 * 60 * 60 * 1000)
  if (now > expiresAt) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({
    propertyName: chat.property.name,
    propertyCity: chat.property.city,
    guestName: chat.reservation.guestName,
    checkIn: chat.reservation.checkIn,
    checkOut: chat.reservation.checkOut,
    language: chat.language,
    escalationStatus: chat.escalationStatus,
    messages: chat.messages,
  })
}
