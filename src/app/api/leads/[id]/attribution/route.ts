import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

/** POST — attribute a lead to a campaign */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const { campaignId } = await request.json()
  if (!campaignId) return NextResponse.json({ error: 'campaignId required' }, { status: 400 })

  // upsert — silently ignores duplicate attribution
  const attribution = await prisma.leadAttribution.upsert({
    where:  { leadId_campaignId: { leadId: params.id, campaignId } },
    create: { leadId: params.id, campaignId },
    update: {},
    include: { campaign: { select: { id: true, name: true, channel: true } } },
  })
  return NextResponse.json(attribution, { status: 201 })
}

/** DELETE /api/leads/[id]/attribution?campaignId=... */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const campaignId = new URL(request.url).searchParams.get('campaignId')
  if (!campaignId) return NextResponse.json({ error: 'campaignId query param required' }, { status: 400 })

  await prisma.leadAttribution.deleteMany({
    where: { leadId: params.id, campaignId },
  })
  return new NextResponse(null, { status: 204 })
}
