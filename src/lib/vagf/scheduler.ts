import { prisma } from '../prisma'
import crypto from 'crypto'

/**
 * Schedule a feedback call 24h after checkout.
 * Called automatically when a reservation status changes to COMPLETED.
 */
export async function scheduleGuestFeedbackCall(reservationId: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      property: {
        select: {
          id: true, name: true, city: true, ownerId: true,
          owner: { select: { subscriptionPlan: true } },
        },
      },
    },
  })

  if (!reservation) return null
  if (!reservation.feedbackEligible) return null
  if (!reservation.guestPhone) {
    console.warn(`[VAGF] No phone for reservation ${reservationId} — skipping`)
    return null
  }

  // VAGF voice feedback is a paid feature — available from BASIC plan onwards
  const plan = reservation.property.owner?.subscriptionPlan
  if (!plan || plan === 'STARTER') {
    console.log(`[VAGF] Skipped feedback scheduling for ${reservationId} — owner plan ${plan ?? 'null'} does not include voice feedback`)
    return null
  }

  // Don't double-schedule
  const existing = await prisma.guestFeedback.findUnique({
    where: { reservationId },
    select: { id: true },
  })
  if (existing) return existing

  // Find crew member who did checkout/cleaning
  // Find crew member who did checkout/cleaning for this property around checkout date
  const checkoutTask = await prisma.task.findFirst({
    where: {
      propertyId: reservation.propertyId,
      type: { in: ['CHECK_OUT', 'CLEANING'] },
      status: { in: ['APPROVED', 'COMPLETED', 'SUBMITTED'] },
      dueDate: {
        gte: new Date(reservation.checkOut.getTime() - 24 * 60 * 60 * 1000),
        lte: new Date(reservation.checkOut.getTime() + 24 * 60 * 60 * 1000),
      },
    },
    select: { assigneeId: true },
    orderBy: { createdAt: 'desc' },
  })

  // Schedule 24h after checkout, adjusted to reasonable hours
  const callTime = adjustToReasonableHour(
    new Date(reservation.checkOut.getTime() + 24 * 60 * 60 * 1000),
    reservation.guestTimezone,
  )

  try {
    const feedback = await prisma.guestFeedback.create({
      data: {
        reservationId,
        propertyId: reservation.propertyId,
        clientId: reservation.property.ownerId,
        crewMemberId: checkoutTask?.assigneeId ?? null,
        callStatus: 'SCHEDULED',
        callScheduledAt: callTime,
        language: reservation.guestLanguage ?? 'en',
        webToken: crypto.randomBytes(32).toString('hex'),
      },
    })
    return feedback
  } catch (err) {
    // Concurrent call won the race — return the existing feedback
    if ((err as { code?: string }).code === 'P2002') {
      return prisma.guestFeedback.findUnique({ where: { reservationId } })
    }
    throw err
  }
}

/**
 * Adjust a timestamp to fall between 10:00-18:00 in the guest's timezone.
 * If no timezone, assumes Europe/Madrid (UTC+1/+2).
 */
function adjustToReasonableHour(dt: Date, timezone?: string | null): Date {
  const offsetHours = timezone
    ? getTimezoneOffset(timezone)
    : 1 // CET default

  const localHour = dt.getUTCHours() + offsetHours

  if (localHour < 10) {
    dt.setUTCHours(10 - offsetHours, 0, 0, 0)
  } else if (localHour >= 18) {
    // Push to next day 10:00
    dt.setDate(dt.getDate() + 1)
    dt.setUTCHours(10 - offsetHours, 0, 0, 0)
  }

  // Skip weekends — push to Monday
  const day = dt.getUTCDay()
  if (day === 0) dt.setDate(dt.getDate() + 1) // Sunday → Monday
  if (day === 6) dt.setDate(dt.getDate() + 2) // Saturday → Monday

  return dt
}

function getTimezoneOffset(tz: string): number {
  const offsets: Record<string, number> = {
    'Europe/Madrid': 1, 'Europe/London': 0, 'Europe/Berlin': 1,
    'Europe/Stockholm': 1, 'Europe/Oslo': 1, 'Europe/Amsterdam': 1,
    'Europe/Paris': 1, 'Europe/Copenhagen': 1,
  }
  return offsets[tz] ?? 1
}

/**
 * Get all scheduled calls that are due now.
 * Used by the cron job to trigger call execution.
 */
export async function getDueScheduledCalls(limit = 20) {
  return prisma.guestFeedback.findMany({
    where: {
      callStatus: 'SCHEDULED',
      callScheduledAt: { lte: new Date() },
    },
    include: {
      reservation: {
        select: {
          guestName: true,
          guestPhone: true,
          guestLanguage: true,
          checkOut: true,
          platform: true,
        },
      },
      property: { select: { name: true, city: true } },
    },
    orderBy: { callScheduledAt: 'asc' },
    take: limit,
  })
}
