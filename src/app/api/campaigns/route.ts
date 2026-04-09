import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const campaigns = await prisma.campaign.findMany({
    include: { _count: { select: { leadAttributions: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(campaigns)
}

export async function POST(request: NextRequest) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const body = await request.json()
  const { name, channel, type, budgetAllocated, startDate, endDate, targetAudience, description } = body

  if (!name || !channel || !type) {
    return NextResponse.json({ error: 'name, channel and type required' }, { status: 400 })
  }

  const campaign = await prisma.campaign.create({
    data: {
      name,
      channel,
      type,
      budgetAllocated: Number(budgetAllocated) || 0,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      targetAudience: targetAudience ?? null,
      description: description ?? null,
      createdById: me.id,
    },
  })
  return NextResponse.json(campaign, { status: 201 })
}
