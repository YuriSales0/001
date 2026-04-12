import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

/**
 * GET /api/contracts — list contracts
 *   ADMIN: all contracts (or ?userId=xxx)
 *   Others: own contracts only
 *
 * POST /api/contracts — create contract (ADMIN only)
 */
export async function GET(request: NextRequest) {
  const guard = await requireRole(['ADMIN', 'MANAGER', 'CREW', 'CLIENT'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const userId = request.nextUrl.searchParams.get('userId')

  const where = me.role === 'ADMIN' && userId
    ? { userId }
    : me.role === 'ADMIN'
    ? {}
    : { userId: me.id }

  const contracts = await prisma.contract.findMany({
    where,
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(contracts)
}

export async function POST(request: NextRequest) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const body = await request.json()
  const { userId, type, title, terms, compensation, startDate, endDate, notes } = body

  if (!userId || !type || !title || !terms || !startDate) {
    return NextResponse.json({ error: 'userId, type, title, terms, startDate required' }, { status: 400 })
  }

  const contract = await prisma.contract.create({
    data: {
      userId,
      type,
      title,
      terms,
      compensation: compensation ?? null,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      notes: notes ?? null,
      signedByAdmin: true, // Admin creates = admin signs
    },
    include: { user: { select: { name: true, email: true, role: true } } },
  })

  return NextResponse.json(contract, { status: 201 })
}
