import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { calcCommission } from '@/lib/finance'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { error, status, user } = await requireRole(['ADMIN', 'MANAGER', 'CLIENT'])
  if (error) return NextResponse.json({ error }, { status })

  try {
    const { searchParams } = new URL(request.url)
    const statusParam = searchParams.get('status')
    const propertyId = searchParams.get('propertyId')
    const clientQuery = searchParams.get('client') // name/email/id (admin only)

    const where: Record<string, unknown> = {}
    if (statusParam) where.status = statusParam
    if (propertyId) where.propertyId = propertyId

    if (user!.role === 'CLIENT') {
      where.property = { ownerId: user!.id }
    } else if (user!.role === 'MANAGER') {
      where.property = { owner: { managerId: user!.id } }
    } else if (user!.role === 'ADMIN' && clientQuery) {
      where.property = {
        owner: {
          OR: [
            { id: clientQuery },
            { email: { contains: clientQuery, mode: 'insensitive' } },
            { name: { contains: clientQuery, mode: 'insensitive' } },
          ],
        },
      }
    }

    const payouts = await prisma.payout.findMany({
      where,
      include: {
        property: { select: { id: true, name: true, owner: { select: { id: true, name: true, email: true } } } },
        reservation: { select: { id: true, guestName: true, checkIn: true, checkOut: true } },
      },
      orderBy: { scheduledFor: 'asc' },
      take: 500,
    })

    return NextResponse.json(payouts)
  } catch (e) {
    console.error('Error fetching payouts:', e)
    return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  try {
    const body = await request.json()
    const { propertyId, grossAmount, scheduledFor, platform, description } = body as {
      propertyId: string
      grossAmount: number
      scheduledFor: string
      platform?: string
      description?: string
    }

    if (!propertyId || !grossAmount || !scheduledFor) {
      return NextResponse.json({ error: 'propertyId, grossAmount and scheduledFor are required' }, { status: 400 })
    }

    // Get owner's plan to calculate commission
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { owner: { select: { id: true, subscriptionPlan: true } } },
    })
    if (!property) return NextResponse.json({ error: 'Property not found' }, { status: 404 })

    const { commission, commissionRate, net } = calcCommission(+grossAmount, property.owner?.subscriptionPlan)

    const payout = await prisma.payout.create({
      data: {
        propertyId,
        grossAmount,
        commission,
        commissionRate,
        netAmount: net,
        scheduledFor: new Date(scheduledFor),
        platform: (platform as "AIRBNB" | "BOOKING" | "DIRECT" | "OTHER") || null,
        description: description ?? null,
        status: 'SCHEDULED',
      },
      include: {
        property: { select: { id: true, name: true, owner: { select: { id: true, name: true, email: true } } } },
        reservation: { select: { id: true, guestName: true, checkIn: true, checkOut: true } },
      },
    })

    return NextResponse.json(payout, { status: 201 })
  } catch (e) {
    console.error('Error creating payout:', e)
    return NextResponse.json({ error: 'Failed to create payout' }, { status: 500 })
  }
}
