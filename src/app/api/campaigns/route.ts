import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  // MANAGER can only see campaigns they created
  const where: Record<string, unknown> = {}
  if (me.role === 'MANAGER') where.createdById = me.id

  const campaigns = await prisma.campaign.findMany({
    where,
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

  // Auto-generate a short tracking code for physical/print campaigns
  const needsCode = ['PHYSICAL', 'PRINT'].includes(type)
  let trackingCode: string | null = null
  if (needsCode) {
    // Generate unique 6-char code, retry on collision
    for (let i = 0; i < 10; i++) {
      const candidate = Math.random().toString(36).slice(2, 8).toUpperCase()
      const exists = await prisma.campaign.findUnique({ where: { trackingCode: candidate } })
      if (!exists) { trackingCode = candidate; break }
    }
  }

  const campaign = await prisma.campaign.create({
    data: {
      name,
      channel,
      type,
      trackingCode,
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
