import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { crewScoreEngine } from '@/lib/crew-score'
import { notify } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  try {
    const body = await req.json()
    const { reservationId, cleaningRating, setupRating, conditionRating, guestComments, issuesReported } = body

    // Validate required fields
    if (!reservationId) {
      return NextResponse.json({ error: 'reservationId is required' }, { status: 400 })
    }

    // Validate ratings are 1-5
    for (const [label, val] of [['cleaningRating', cleaningRating], ['setupRating', setupRating], ['conditionRating', conditionRating]] as const) {
      if (typeof val !== 'number' || val < 1 || val > 5 || !Number.isInteger(val)) {
        return NextResponse.json({ error: `${label} must be an integer between 1 and 5` }, { status: 400 })
      }
    }

    // Fetch reservation with property + owner
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        property: {
          include: {
            owner: { select: { id: true, managerId: true } },
          },
        },
        stayReview: { select: { id: true } },
      },
    })

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    // Check reservation is completed
    if (reservation.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Reservation must be COMPLETED before review' }, { status: 400 })
    }

    // Already reviewed
    if (reservation.stayReview) {
      return NextResponse.json({ error: 'This reservation has already been reviewed' }, { status: 409 })
    }

    // Scoping: Manager can only review their own clients' reservations
    if (me.role === 'MANAGER' && reservation.property.owner.managerId !== me.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Calculate weighted overall rating: (cleaning*3 + setup*2 + condition*1) / 6
    const overallRating = Number(
      ((cleaningRating * 3 + setupRating * 2 + conditionRating * 1) / 6).toFixed(2)
    )

    // Find the Crew member who did a CHECK_OUT or CLEANING task for this property
    // around the checkout date (within 2 days)
    const checkoutDate = new Date(reservation.checkOut)
    const dayBefore = new Date(checkoutDate)
    dayBefore.setDate(dayBefore.getDate() - 2)
    const dayAfter = new Date(checkoutDate)
    dayAfter.setDate(dayAfter.getDate() + 2)

    const crewTask = await prisma.task.findFirst({
      where: {
        propertyId: reservation.propertyId,
        type: { in: ['CHECK_OUT', 'CLEANING'] },
        status: { in: ['APPROVED', 'COMPLETED'] },
        dueDate: { gte: dayBefore, lte: dayAfter },
        assigneeId: { not: null },
      },
      orderBy: { dueDate: 'desc' },
      select: { assigneeId: true },
    })

    const crewMemberId = crewTask?.assigneeId ?? null

    // Save the review
    const review = await prisma.stayReview.create({
      data: {
        reservationId,
        propertyId: reservation.propertyId,
        reviewerId: me.id,
        cleaningRating,
        setupRating,
        conditionRating,
        overallRating,
        guestComments: guestComments ?? null,
        issuesReported: issuesReported ?? null,
        crewMemberId,
        scoreApplied: !!crewMemberId,
      },
    })

    // Apply score impact to Crew if we found a crew member
    if (crewMemberId) {
      if (overallRating >= 4.0) {
        await crewScoreEngine.applyDelta(crewMemberId, 'OWNER_POSITIVE', reservationId).catch(console.error)
      } else if (overallRating <= 2.5) {
        await crewScoreEngine.applyDelta(crewMemberId, 'COMPLAINT', reservationId).catch(console.error)
      }
      // Between 2.5 and 4.0 = neutral, no score change
    }

    // Notify Captain if any category has low rating
    const minRating = Math.min(cleaningRating, setupRating, conditionRating)

    if (minRating <= 3) {
      // Find captain(s)
      const captains = await prisma.user.findMany({
        where: { role: 'CREW', isCaptain: true },
        select: { id: true },
      })

      const isUrgent = minRating <= 2
      const alertTitle = isUrgent
        ? `URGENT: Low stay review at ${reservation.property.name}`
        : `Info: Stay review flag at ${reservation.property.name}`
      const alertBody = `Cleaning: ${cleaningRating}/5, Setup: ${setupRating}/5, Condition: ${conditionRating}/5 (Overall: ${overallRating})`

      for (const captain of captains) {
        notify({
          userId: captain.id,
          type: 'GENERAL',
          title: alertTitle,
          body: alertBody,
          link: '/crew',
        }).catch(() => {})
      }

      // Also notify admins for urgent alerts
      if (isUrgent) {
        const admins = await prisma.user.findMany({
          where: { role: 'ADMIN' },
          select: { id: true },
        })
        for (const admin of admins) {
          notify({
            userId: admin.id,
            type: 'GENERAL',
            title: alertTitle,
            body: alertBody,
            link: '/reviews',
          }).catch(() => {})
        }
      }
    }

    return NextResponse.json(review, { status: 201 })
  } catch (e) {
    console.error('Failed to submit review:', e)
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 })
  }
}
