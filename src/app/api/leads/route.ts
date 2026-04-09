import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

const LEAD_INCLUDE = {
  owner: { select: { id: true, name: true, email: true } },
  assignedManager: { select: { id: true, name: true, email: true } },
  leadAttributions: {
    include: { campaign: { select: { id: true, name: true, channel: true } } },
  },
} as const

export async function GET(request: NextRequest) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  // MANAGER sees only leads assigned to them
  if (me.role === 'MANAGER') where.assignedManagerId = me.id

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leads = await (prisma.lead as any).findMany({
    where,
    include: LEAD_INCLUDE,
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(leads)
}

export async function POST(request: NextRequest) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const body = await request.json()
  const {
    name, email, phone, source, message, notes,
    budget, propertyType, followUpDate, assignedManagerId,
  } = body

  if (!name || !source) {
    return NextResponse.json({ error: 'name and source are required' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lead = await (prisma.lead as any).create({
    data: {
      name,
      email: email || null,
      phone: phone || null,
      source,
      message: message || null,
      notes: notes || null,
      budget: budget ? Number(budget) : null,
      propertyType: propertyType || null,
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      assignedManagerId: assignedManagerId || null,
    },
    include: LEAD_INCLUDE,
  })

  return NextResponse.json(lead, { status: 201 })
}
