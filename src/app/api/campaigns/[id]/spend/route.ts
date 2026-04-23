import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { amount, date, description, receiptUrl } = body

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 })
  }

  const campaign = await prisma.campaign.findUnique({ where: { id: params.id } })
  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

  // MANAGER can only add spend to campaigns they created
  const me = guard.user!
  if (me.role === 'MANAGER' && campaign.createdById !== me.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [spend] = await prisma.$transaction([
    prisma.campaignSpend.create({
      data: {
        campaignId:  params.id,
        amount:      Number(amount),
        date:        date ? new Date(date) : new Date(),
        description: description ?? null,
        receiptUrl:  receiptUrl  ?? null,
      },
    }),
    prisma.campaign.update({
      where: { id: params.id },
      data:  { budgetSpent: { increment: Number(amount) } },
    }),
  ])

  return NextResponse.json(spend, { status: 201 })
}
