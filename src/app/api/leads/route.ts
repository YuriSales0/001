import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { notify } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

function stripTags(s: string | null | undefined): string | null {
  if (!s) return null
  return s.replace(/<[^>]*>/g, '').trim()
}

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

  const leads = await prisma.lead.findMany({
    where,
    include: LEAD_INCLUDE,
    orderBy: { createdAt: 'desc' },
    take: 500,
  })

  return NextResponse.json(leads)
}

export async function POST(request: NextRequest) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const {
    name, email, phone, source, message, notes,
    budget, propertyType, followUpDate, assignedManagerId, partnerCode,
  } = body

  if (!name || !source) {
    return NextResponse.json({ error: 'name and source are required' }, { status: 400 })
  }

  const cleanName = stripTags(name) || name
  const cleanNotes = stripTags(notes)
  const cleanMessage = stripTags(message)

  // MANAGER creating a lead always owns it — ignore client-supplied value
  const resolvedManagerId = me.role === 'MANAGER' ? me.id : (assignedManagerId || null)

  // Resolve partner from referral code
  let partnerId: string | null = null
  if (partnerCode && typeof partnerCode === 'string') {
    const partner = await prisma.partner.findUnique({
      where: { referralCode: partnerCode.toUpperCase() },
      select: { id: true },
    })
    if (partner) partnerId = partner.id
  }

  const lead = await prisma.lead.create({
    data: {
      name: cleanName,
      email: email || null,
      phone: phone || null,
      source,
      message: cleanMessage,
      notes: cleanNotes,
      budget: budget ? Number(budget) : null,
      propertyType: propertyType || null,
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      assignedManagerId: resolvedManagerId,
      partnerId,
    },
    include: LEAD_INCLUDE,
  })

  // Increment partner referral count
  if (partnerId) {
    await prisma.partner.update({
      where: { id: partnerId },
      data: { totalReferrals: { increment: 1 } },
    }).catch(() => {})
  }

  if (resolvedManagerId) {
    notify({
      userId: resolvedManagerId,
      type: 'NEW_LEAD',
      title: 'New lead in your pipeline',
      body: `${cleanName}${lead.email ? ` (${lead.email})` : ''} — ${lead.source}`,
      link: '/crm',
    }).catch(() => {})
  }

  return NextResponse.json(lead, { status: 201 })
}
