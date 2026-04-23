import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/ses-export — export guest registration data for SES (Registro de Viajeros)
 *
 * Spanish law (RD 933/2021) requires all tourist accommodation to report
 * guest data to the SES within 24h of check-in. This endpoint exports
 * the required fields in a structured format for manual submission or
 * future API integration with the SES portal.
 *
 * Query params:
 *   from: ISO date (default: 30 days ago)
 *   to: ISO date (default: today)
 *   pending: "true" to only show unsubmitted (sesSubmittedAt is null)
 */
export async function GET(request: NextRequest) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const params = request.nextUrl.searchParams
  const from = params.get('from')
    ? new Date(params.get('from')!)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const to = params.get('to') ? new Date(params.get('to')!) : new Date()
  const pendingOnly = params.get('pending') === 'true'

  const where: Record<string, unknown> = {
    checkIn: { gte: from, lte: to },
    status: { in: ['UPCOMING', 'ACTIVE', 'COMPLETED'] },
  }
  if (pendingOnly) where.sesSubmittedAt = null

  const reservations = await prisma.reservation.findMany({
    where,
    select: {
      id: true,
      guestName: true,
      guestNationality: true,
      guestDocumentType: true,
      guestDocumentNumber: true,
      guestDateOfBirth: true,
      guestGender: true,
      guestAddress: true,
      guestPhone: true,
      guestEmail: true,
      checkIn: true,
      checkOut: true,
      sesSubmittedAt: true,
      sesReference: true,
      property: { select: { id: true, name: true, address: true, city: true } },
    },
    orderBy: { checkIn: 'asc' },
    take: 500,
  })

  const missingFields = reservations.filter(r =>
    !r.sesSubmittedAt && (!r.guestDocumentType || !r.guestDocumentNumber || !r.guestNationality)
  )

  return NextResponse.json({
    period: { from: from.toISOString(), to: to.toISOString() },
    total: reservations.length,
    submitted: reservations.filter(r => r.sesSubmittedAt).length,
    pending: reservations.filter(r => !r.sesSubmittedAt).length,
    missingData: missingFields.length,
    guests: reservations,
  })
}

/**
 * PATCH /api/admin/ses-export — mark reservations as submitted to SES
 * Body: { reservationIds: string[], sesReference?: string }
 */
export async function PATCH(request: NextRequest) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  let body: { reservationIds?: string[]; sesReference?: string }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { reservationIds, sesReference } = body
  if (!reservationIds || !Array.isArray(reservationIds) || reservationIds.length === 0) {
    return NextResponse.json({ error: 'reservationIds required' }, { status: 400 })
  }

  const updated = await prisma.reservation.updateMany({
    where: { id: { in: reservationIds } },
    data: {
      sesSubmittedAt: new Date(),
      sesReference: sesReference ?? null,
    },
  })

  return NextResponse.json({ ok: true, updated: updated.count })
}
