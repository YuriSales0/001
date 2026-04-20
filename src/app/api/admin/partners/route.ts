import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'HM-'
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function GET() {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const partners = await prisma.partner.findMany({
    include: {
      _count: { select: { leads: true } },
      leads: {
        where: { status: 'CONVERTED' },
        select: { id: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const result = partners.map(({ leads, _count, ...p }) => ({
    ...p,
    leadCount: _count.leads,
    conversionCount: leads.length,
  }))

  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  try {
    const body = await request.json()
    const { name, businessName, email, phone, tier, zone, notes, commissionFixed, commissionPct } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    // Generate unique referral code
    let referralCode = generateReferralCode()
    let attempts = 0
    while (attempts < 10) {
      const existing = await prisma.partner.findUnique({ where: { referralCode } })
      if (!existing) break
      referralCode = generateReferralCode()
      attempts++
    }

    const partner = await prisma.partner.create({
      data: {
        name: name.trim(),
        businessName: businessName?.trim() || null,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        tier: tier || 'STANDARD',
        referralCode,
        zone: zone?.trim() || null,
        notes: notes?.trim() || null,
        commissionFixed: commissionFixed != null ? commissionFixed : null,
        commissionPct: commissionPct != null ? commissionPct : null,
      },
    })

    return NextResponse.json(partner, { status: 201 })
  } catch (e) {
    console.error('Failed to create partner:', e)
    return NextResponse.json({ error: 'Failed to create partner' }, { status: 500 })
  }
}
