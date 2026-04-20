import { NextRequest, NextResponse } from 'next/server'
// @ts-expect-error Partner model available after prisma generate
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

type RouteContext = { params: { id: string } }

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const partner = await prisma.partner.findUnique({
    where: { id: params.id },
    include: {
      _count: { select: { leads: true } },
      leads: {
        select: { id: true, name: true, email: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  })

  if (!partner) {
    return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
  }

  const conversionCount = partner.leads.filter(l => l.status === 'CONVERTED').length

  return NextResponse.json({ ...partner, conversionCount })
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  try {
    const body = await request.json()
    const { name, businessName, email, phone, tier, status, zone, notes, commissionFixed, commissionPct } = body

    const existing = await prisma.partner.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name.trim()
    if (businessName !== undefined) data.businessName = businessName?.trim() || null
    if (email !== undefined) data.email = email?.trim() || null
    if (phone !== undefined) data.phone = phone?.trim() || null
    if (tier !== undefined) data.tier = tier
    if (status !== undefined) data.status = status
    if (zone !== undefined) data.zone = zone?.trim() || null
    if (notes !== undefined) data.notes = notes?.trim() || null
    if (commissionFixed !== undefined) data.commissionFixed = commissionFixed
    if (commissionPct !== undefined) data.commissionPct = commissionPct

    const partner = await prisma.partner.update({
      where: { id: params.id },
      data,
    })

    return NextResponse.json(partner)
  } catch (e) {
    console.error('Failed to update partner:', e)
    return NextResponse.json({ error: 'Failed to update partner' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const existing = await prisma.partner.findUnique({ where: { id: params.id } })
  if (!existing) {
    return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
  }

  // Soft delete: set status to INACTIVE
  const partner = await prisma.partner.update({
    where: { id: params.id },
    data: { status: 'INACTIVE' },
  })

  return NextResponse.json(partner)
}
