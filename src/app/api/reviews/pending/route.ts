import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export async function GET() {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  try {
    // Build the where clause scoped to manager's clients
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      status: 'COMPLETED',
      stayReview: null, // no review yet
    }

    // Manager can only see their own clients' reservations
    if (me.role === 'MANAGER') {
      where.property = {
        owner: { managerId: me.id },
      }
    }

    const reservations = await prisma.reservation.findMany({
      where,
      orderBy: { checkOut: 'desc' },
      include: {
        property: {
          select: { id: true, name: true, city: true },
        },
      },
    })

    return NextResponse.json(reservations)
  } catch (e) {
    console.error('Failed to fetch pending reviews:', e)
    return NextResponse.json({ error: 'Failed to fetch pending reviews' }, { status: 500 })
  }
}
