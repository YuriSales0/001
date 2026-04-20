import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

const LEAD_INCLUDE = {
  owner: { select: { id: true, name: true, email: true } },
  assignedManager: { select: { id: true, name: true, email: true } },
} as const

// Partner commission amounts by tier
const PARTNER_COMMISSION: Record<string, number> = {
  STANDARD: 50,
  STANDARD_PLUS: 75,
  PREMIUM: 200,
  STRATEGIC: 0, // uses commissionFixed from partner record
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    select: { id: true, assignedManagerId: true, status: true, partnerId: true, name: true } as Record<string, boolean>,
  }) as { id: string; assignedManagerId: string | null; status: string; partnerId: string | null; name: string } | null
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

  // MANAGER can only update leads assigned to them
  if (me.role === 'MANAGER' && lead.assignedManagerId !== me.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const {
    status, notes, followUpDate, assignedManagerId,
    budget, propertyType, name, email, phone, source, message,
    score, bantData,
  } = body

  // Only ADMIN can reassign managers
  const managerUpdate = me.role === 'ADMIN' && assignedManagerId !== undefined
    ? { assignedManagerId: assignedManagerId || null }
    : {}

  const updated = await prisma.lead.update({
    where: { id: params.id },
    data: {
      ...(status !== undefined && { status }),
      ...(notes !== undefined && { notes }),
      ...(followUpDate !== undefined && { followUpDate: followUpDate ? new Date(followUpDate) : null }),
      ...(budget !== undefined && { budget: budget ? Number(budget) : null }),
      ...(propertyType !== undefined && { propertyType: propertyType || null }),
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email: email || null }),
      ...(phone !== undefined && { phone: phone || null }),
      ...(source !== undefined && { source }),
      ...(message !== undefined && { message: message || null }),
      ...(score !== undefined && { score: Number(score) }),
      ...(bantData !== undefined && { bantData }),
      ...managerUpdate,
    },
    include: LEAD_INCLUDE,
  })

  // Auto-create PartnerPayout when lead transitions to CONVERTED with a partnerId
  if (
    status === 'CONVERTED' &&
    lead.status !== 'CONVERTED' &&
    lead.partnerId
  ) {
    try {
      // @ts-expect-error Partner model pending prisma generate
      const partner = await prisma.partner.findUnique({
        where: { id: lead.partnerId },
        select: { id: true, tier: true, commissionFixed: true },
      })

      if (partner) {
        const tier = partner.tier as string
        let amount = PARTNER_COMMISSION[tier] || 50
        // STRATEGIC uses custom commission
        if (tier === 'STRATEGIC' && partner.commissionFixed) {
          amount = parseFloat(partner.commissionFixed.toString())
        }

        const now = new Date()
        const holdUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // +30 days
        const reversalDeadline = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000) // +60 days

        // @ts-expect-error PartnerPayout model pending prisma generate
        await prisma.partnerPayout.create({
          data: {
            partnerId: partner.id,
            leadId: lead.id,
            clientName: lead.name || null,
            amount,
            status: 'PENDING',
            holdUntil,
            reversalDeadline,
          },
        })

        // Increment partner conversion count and total commission
        // @ts-expect-error Partner model pending prisma generate
        await prisma.partner.update({
          where: { id: partner.id },
          data: {
            totalConversions: { increment: 1 },
            totalCommission: { increment: amount },
          },
        })
      }
    } catch (err) {
      console.error('[Lead PATCH] Failed to create PartnerPayout:', err)
      // Don't fail the lead update if payout creation fails
    }
  }

  return NextResponse.json(updated)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  await prisma.lead.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
