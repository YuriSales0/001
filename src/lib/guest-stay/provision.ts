import { prisma } from '../prisma'
import crypto from 'crypto'
import { sendSms, stayChatWelcomeSms } from '../sms'

/**
 * Provision a GuestStayChat for a reservation.
 * Called when the reservation becomes ACTIVE (check-in happens).
 *
 * Steps:
 *   1. Create chat + token (idempotent per reservation)
 *   2. Persist SYSTEM welcome message
 *   3. Dispatch SMS with stay chat URL to guest's phone (if available)
 *
 * SMS is best-effort — failures don't block chat creation.
 * Guest can still access via direct URL shared by Manager.
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
      property: { select: { id: true, name: true, ownerId: true } },
    },
  })
  if (!reservation) return null
  if (!reservation.guestPhone && !reservation.guestEmail) return null

  const token = crypto.randomBytes(32).toString('hex')

  let chat: { id: string; token: string }
  try {
    chat = await prisma.guestStayChat.create({
      data: {
        reservationId,
        propertyId: reservation.propertyId,
        clientId: reservation.property.ownerId,
        token,
        language: reservation.guestLanguage ?? 'en',
      },
      select: { id: true, token: true },
    })
  } catch (err) {
    // Concurrent call won the race — return the existing chat
    if ((err as { code?: string }).code === 'P2002') {
      const existingByReservation = await prisma.guestStayChat.findUnique({
        where: { reservationId },
        select: { id: true, token: true },
      })
      if (existingByReservation) return existingByReservation
    }
    throw err
  }

  await prisma.guestStayMessage.create({
    data: {
      chatId: chat.id,
      author: 'SYSTEM',
      content: 'Stay chat provisioned. AI assistant ready.',
    },
  })

  // Fire-and-forget SMS to guest with the stay chat URL
  if (reservation.guestPhone) {
    const url = stayChatUrl(token)
    const body = stayChatWelcomeSms(
      reservation.guestLanguage ?? 'en',
      reservation.guestName,
      reservation.property.name,
      url,
    )
    sendSms({ to: reservation.guestPhone, body })
      .then(r => {
        if (!r.ok) console.warn(`[StayChat] SMS send failed for ${reservationId}: ${r.error}`)
      })
      .catch(err => console.error('[StayChat] SMS dispatch error:', err))
  }

  return chat
}

export function stayChatUrl(token: string): string {
  const base = process.env.NEXTAUTH_URL || 'https://hostmasters.es'
  return `${base}/stay/${token}`
}
