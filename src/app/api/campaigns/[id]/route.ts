import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const campaign = await prisma.campaign.findUnique({
    where: { id: params.id },
    include: {
      spends: { orderBy: { date: 'desc' } },
      _count: { select: { leadAttributions: true } },
    },
  })
  if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // MANAGER can only see campaigns they created
  if (me.role === 'MANAGER' && campaign.createdById !== me.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json(campaign)
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  // MANAGER can only edit campaigns they created
  if (me.role === 'MANAGER') {
    const existing = await prisma.campaign.findUnique({ where: { id: params.id }, select: { createdById: true } })
    if (!existing || existing.createdById !== me.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const body = await request.json()
  const { name, status, channel, type, budgetAllocated, startDate, endDate, targetAudience, description, notes } = body

  const data: Record<string, unknown> = {}
  if (name !== undefined)            data.name            = name
  if (status !== undefined)          data.status          = status
  if (channel !== undefined)         data.channel         = channel
  if (type !== undefined)            data.type            = type
  if (budgetAllocated !== undefined) data.budgetAllocated = Number(budgetAllocated)
  if (startDate !== undefined)       data.startDate       = startDate ? new Date(startDate) : null
  if (endDate !== undefined)         data.endDate         = endDate   ? new Date(endDate)   : null
  if (targetAudience !== undefined)  data.targetAudience  = targetAudience ?? null
  if (description !== undefined)     data.description     = description ?? null
  if (notes !== undefined)           data.notes           = notes ?? null

  const campaign = await prisma.campaign.update({ where: { id: params.id }, data })
  return NextResponse.json(campaign)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  // MANAGER can only delete campaigns they created
  if (me.role === 'MANAGER') {
    const existing = await prisma.campaign.findUnique({ where: { id: params.id }, select: { createdById: true } })
    if (!existing || existing.createdById !== me.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  await prisma.campaign.delete({ where: { id: params.id } })
  return new NextResponse(null, { status: 204 })
}
