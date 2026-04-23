import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export async function GET(req: NextRequest) {
  const guard = await requireRole(['ADMIN', 'MANAGER', 'CREW'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  try {
    const { searchParams } = new URL(req.url)
    const propertyId = searchParams.get('propertyId')
    const crewMemberId = searchParams.get('crewMemberId')
    const minRating = searchParams.get('minRating')
    const maxRating = searchParams.get('maxRating')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}

    if (propertyId) where.propertyId = propertyId
    if (crewMemberId) where.crewMemberId = crewMemberId

    if (minRating || maxRating) {
      where.overallRating = {}
      if (minRating) where.overallRating.gte = parseFloat(minRating)
      if (maxRating) where.overallRating.lte = parseFloat(maxRating)
    }

    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to)
    }

    // Scoping: Manager sees only their clients' reviews
    if (me.role === 'MANAGER') {
      where.property = { owner: { managerId: me.id } }
    }

    // Crew Captain sees all; regular Crew sees only their own
    if (me.role === 'CREW' && !me.isCaptain) {
      where.crewMemberId = me.id
    }

    const reviews = await prisma.stayReview.findMany({
      where,
      take: 200,
      orderBy: { createdAt: 'desc' },
      include: {
        reservation: {
          select: {
            id: true,
            guestName: true,
            guestNationality: true,
            checkIn: true,
            checkOut: true,
            platform: true,
          },
        },
        property: {
          select: { id: true, name: true, city: true },
        },
        reviewer: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json(reviews)
  } catch (e) {
    console.error('Failed to fetch reviews:', e)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}
