import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { notify, tForUser } from '@/lib/notifications'

const PARTNER_COMMISSION: Record<string, number> = {
  STANDARD: 50,
  STANDARD_PLUS: 75,
  PREMIUM: 200,
  STRATEGIC: 0,
}

async function convertLeadOnContractSign(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } }) as any
  if (!user?.email) return

  // Use transaction to prevent double-conversion race condition
  await prisma.$transaction(async (tx) => {
    const lead = await tx.lead.findFirst({
      where: {
        OR: [
          { convertedUserId: userId },
          { email: user.email },
        ],
        status: { not: 'CONVERTED' },
      },
      orderBy: { createdAt: 'desc' },
    }) as any

    if (!lead) return

    await tx.lead.update({
      where: { id: lead.id },
      data: { status: 'CONVERTED', convertedUserId: userId },
    })

    if (!lead.partnerId) return

    const partner = await tx.partner.findUnique({
      where: { id: lead.partnerId },
      select: { id: true, tier: true, commissionFixed: true, name: true, email: true, status: true },
    })
    if (!partner || (partner as any).status !== 'ACTIVE') return

    const tier = partner.tier as string
    let amount = PARTNER_COMMISSION[tier] || 50
    if (tier === 'STRATEGIC' && partner.commissionFixed) {
      amount = parseFloat(partner.commissionFixed.toString())
    }

    const now = new Date()
    await tx.partnerPayout.create({
      data: {
        partnerId: partner.id,
        leadId: lead.id,
        clientName: lead.name || null,
        amount,
        status: 'PENDING',
        holdUntil: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        reversalDeadline: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
      },
    })

    await tx.partner.update({
      where: { id: partner.id },
      data: {
        totalConversions: { increment: 1 },
        totalCommission: { increment: amount },
      },
    })

    if (partner.email) {
      console.log(`[Partner Conversion] ${partner.name} earns €${amount} from lead "${lead.name}"`)
    }
  }).catch((err) => {
    console.error('[Contract Sign] Lead conversion failed:', err)
  })
}

/**
 * POST /api/contracts/[id]/sign
 *
 * Client signs a service contract.
 * Triggers: property activation + lead → CONVERTED + partner payout creation.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await requireRole(['ADMIN', 'MANAGER', 'CREW', 'CLIENT'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const me = guard.user!

  const contract = await prisma.contract.findUnique({
    where: { id: params.id },
    include: { property: { select: { id: true, status: true } } },
  })

  if (!contract) return NextResponse.json({ error: 'Contract not found' }, { status: 404 })

  if (contract.userId !== me.id) {
    return NextResponse.json({ error: 'You can only sign your own contracts' }, { status: 403 })
  }

  if (contract.signedByUser) {
    return NextResponse.json({ ok: true, alreadySigned: true })
  }

  const now = new Date()
  const shouldActivate =
    contract.propertyId &&
    contract.property &&
    (contract.property.status as string) === 'CONTRACT_PENDING'

  if (shouldActivate) {
    const [updatedContract] = await prisma.$transaction([
      prisma.contract.update({
        where: { id: params.id },
        data: { signedByUser: true, signedAt: now, status: 'ACTIVE' },
      }),
      prisma.property.update({
        where: { id: contract.propertyId! },
        data: { status: 'ACTIVE' },
      }),
    ])

    Promise.all([
      tForUser(me.id, 'notifications.propertyActiveTitle'),
      tForUser(me.id, 'notifications.propertyActiveBody'),
    ]).then(([title, body]) =>
      notify({ userId: me.id, type: 'PROPERTY_ACTIVE', title, body, link: '/client/dashboard' })
    ).catch(() => {})

    convertLeadOnContractSign(me.id).catch(err => console.error('[Contract Sign] Lead conversion failed:', err))

    return NextResponse.json({
      ok: true,
      contractSigned: true,
      propertyActivated: true,
      contractId: updatedContract.id,
    })
  }

  const updated = await prisma.contract.update({
    where: { id: params.id },
    data: { signedByUser: true, signedAt: now, status: 'ACTIVE' },
  })

  Promise.all([
    tForUser(me.id, 'notifications.contractSignedTitle'),
    tForUser(me.id, 'notifications.contractSignedBody'),
  ]).then(([title, body]) =>
    notify({ userId: me.id, type: 'CONTRACT_READY', title, body, link: '/client/properties' })
  ).catch(() => {})

  convertLeadOnContractSign(me.id).catch(console.error)

  return NextResponse.json({ ok: true, contractSigned: true, contractId: updated.id })
}
