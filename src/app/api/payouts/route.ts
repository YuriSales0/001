import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

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
    })

    return NextResponse.json(payouts)
  } catch (e) {
    console.error('Error fetching payouts:', e)
    return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 })
  }
}
