import { prisma } from '../prisma'
import crypto from 'crypto'

/**
 * Provision a GuestStayChat for a reservation.
 * Called when the reservation becomes ACTIVE (check-in happens).
 * Returns existing chat if one was already created.
 */
export async function provisionStayChat(reservationId: string) {
  const existing = await prisma.guestStayChat.findUnique({
    where: { reservationId },
    select: { id: true, token: true },
  })
  if (existing) return existing

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      property: { select: { id: true, ownerId: true } },
    },
  })
  if (!reservation) return null
  if (!reservation.guestPhone && !reservation.guestEmail) return null

  const token = crypto.randomBytes(32).toString('hex')

  const chat = await prisma.guestStayChat.create({
    data: {
      reservationId,
      propertyId: reservation.propertyId,
      clientId: reservation.property.ownerId,
      token,
      language: reservation.guestLanguage ?? 'en',
    },
    select: { id: true, token: true },
  })

  // System welcome message (AI will greet on first guest interaction)
  await prisma.guestStayMessage.create({
    data: {
      chatId: chat.id,
      author: 'SYSTEM',
      content: 'Stay chat provisioned. AI assistant ready.',
    },
  })

  return chat
}

export function stayChatUrl(token: string): string {
  const base = process.env.NEXTAUTH_URL || 'https://hostmasters.es'
  return `${base}/stay/${token}`
}
