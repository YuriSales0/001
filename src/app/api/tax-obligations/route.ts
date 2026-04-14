import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

/** GET — list obligations
 * - CLIENT: only their own
 * - MANAGER: obligations of clients where managerId = me
 * - ADMIN: all, optionally filtered by ?userId=
 */
export async function GET(req: NextRequest) {
  const guard = await requireRole(['ADMIN', 'MANAGER', 'CLIENT'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const me = guard.user!
  const url = new URL(req.url)
  const userIdQuery = url.searchParams.get('userId')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}

  if (me.role === 'CLIENT') {
    where.userId = me.id
  } else if (me.role === 'MANAGER') {
    const clients = await prisma.user.findMany({
      where: { managerId: me.id, role: 'CLIENT' },
      select: { id: true },
    })
    const clientIds = clients.map(c => c.id)
    if (userIdQuery) {
      // Manager can only query their own clients
      if (!clientIds.includes(userIdQuery)) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 })
      }
      where.userId = userIdQuery
    } else {
      where.userId = { in: clientIds }
    }
  } else if (me.role === 'ADMIN' && userIdQuery) {
    where.userId = userIdQuery
  }

  const obligations = await prisma.taxObligation.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
      property: { select: { id: true, name: true } },
    },
    orderBy: [{ dueDate: 'asc' }, { type: 'asc' }],
  })

  return NextResponse.json(obligations)
}

/** POST — create obligation (ADMIN/MANAGER only) */
export async function POST(req: NextRequest) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const body = await req.json()
  const { userId, propertyId, type, periodLabel, dueDate, notes } = body

  if (!userId || !type || !periodLabel) {
    return NextResponse.json({ error: 'userId, type and periodLabel required' }, { status: 400 })
  }

  // Validate obligation type is a valid enum value
  const VALID_TYPES = ['VUT_LICENSE', 'MODELO_179', 'IRNR_MODELO_210', 'NIE', 'ENERGY_CERTIFICATE', 'FISCAL_REPRESENTATIVE', 'IBI', 'OTHER']
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Invalid obligation type' }, { status: 400 })
  }

  // Validate period label format
  const trimmedPeriod = String(periodLabel).trim()
  if (!trimmedPeriod || trimmedPeriod.length > 50) {
    return NextResponse.json({ error: 'Invalid periodLabel (required, max 50 chars)' }, { status: 400 })
  }

  // If manager, verify client belongs to them
  if (guard.user!.role === 'MANAGER') {
    const client = await prisma.user.findUnique({ where: { id: userId } })
    if (!client || client.managerId !== guard.user!.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }
  }

  // If propertyId is provided, verify it belongs to the specified user
  if (propertyId) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true },
    })
    if (!property || property.ownerId !== userId) {
      return NextResponse.json({ error: 'Property does not belong to this user' }, { status: 403 })
    }
  }

  const obligation = await prisma.taxObligation.create({
    data: {
      userId,
      propertyId: propertyId || null,
      type,
      periodLabel: trimmedPeriod,
      dueDate: dueDate ? new Date(dueDate) : null,
      notes: notes || null,
      handledBy: guard.user!.id,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      property: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json(obligation)
}
