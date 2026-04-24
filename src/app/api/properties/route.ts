import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { HOUSE_RULES } from '@/lib/house-rules'
import { DEFAULT_COMMISSION_RATE } from '@/lib/finance'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const guard = await requireRole(['ADMIN', 'MANAGER', 'CLIENT'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const user = guard.user!
  try {
    const { searchParams } = new URL(request.url)
    const ownerId = searchParams.get('ownerId')

    const where: Record<string, unknown> = {}
    if (user.role === 'CLIENT') where.ownerId = user.id
    else if (user.role === 'MANAGER') {
      if (ownerId) {
        const owner = await prisma.user.findUnique({
          where: { id: ownerId },
          select: { managerId: true },
        })
        if (owner?.managerId !== user.id) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
        where.ownerId = ownerId
      } else {
        where.owner = { managerId: user.id }
      }
    }
    else if (ownerId) where.ownerId = ownerId

    const properties = await prisma.property.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            subscriptionPlan: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    })

    return NextResponse.json(properties)
  } catch (error) {
    console.error('Error fetching properties:', error)
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireRole(['ADMIN', 'MANAGER', 'CLIENT'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!
  try {
    const body = await request.json()
    let { ownerId } = body
    const { name, address, city, postalCode, description, photos, commissionRate, houseRules } = body

    // Validate houseRules if provided
    if (houseRules !== undefined) {
      if (!Array.isArray(houseRules)) {
        return NextResponse.json({ error: 'houseRules must be an array' }, { status: 400 })
      }
      const validKeys = new Set(HOUSE_RULES.map(r => r.key))
      const invalid = houseRules.filter((k: string) => !validKeys.has(k))
      if (invalid.length > 0) {
        return NextResponse.json({ error: `Invalid house rule keys: ${invalid.join(', ')}` }, { status: 400 })
      }
    }
    if (me.role === 'CLIENT') ownerId = me.id
    // MANAGER creates for one of their clients — ownerId must be provided and be one of their clients
    if (me.role === 'MANAGER' && ownerId) {
      const owner = await prisma.user.findUnique({ where: { id: ownerId }, select: { managerId: true, role: true } })
      if (owner?.managerId !== me.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }
    // ADMIN — validate ownerId refers to an existing CLIENT
    if (me.role === 'ADMIN' && ownerId) {
      const owner = await prisma.user.findUnique({ where: { id: ownerId }, select: { role: true } })
      if (!owner) {
        return NextResponse.json({ error: 'Owner not found' }, { status: 404 })
      }
      if (owner.role !== 'CLIENT') {
        return NextResponse.json({ error: 'Owner must be a CLIENT user' }, { status: 400 })
      }
    }

    if (!name || !address || !city || !ownerId) {
      return NextResponse.json(
        { error: 'Missing required fields: name, address, city, ownerId' },
        { status: 400 }
      )
    }

    // Admin → ACTIVE immediately
    // Manager → PENDING_CLIENT (client must confirm the property details first)
    // Client → PENDING_APPROVAL (their own property, admin sets up OTA + activates)
    const status = me.role === 'ADMIN' ? 'ACTIVE'
      : me.role === 'MANAGER' ? 'PENDING_CLIENT'
      : 'PENDING_APPROVAL'

    const property = await prisma.property.create({
      data: {
        name,
        address,
        city,
        postalCode,
        description,
        photos: photos || [],
        houseRules: houseRules ?? [],
        ownerId,
        commissionRate: me.role === 'ADMIN' ? (commissionRate ?? DEFAULT_COMMISSION_RATE * 100) : DEFAULT_COMMISSION_RATE * 100,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: status as any,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Provision setup tasks when property needs setup workflow
    // (PENDING_APPROVAL or ACTIVE — admin creates live but still needs AI context filled)
    if (status === 'PENDING_APPROVAL' || status === 'ACTIVE') {
      import('@/lib/setup-tasks')
        .then(({ provisionSetupTasks }) => provisionSetupTasks(property.id))
        .catch(err => console.error('[Setup] provisionSetupTasks failed:', err))
    }

    return NextResponse.json(property, { status: 201 })
  } catch (error) {
    console.error('Error creating property:', error)
    return NextResponse.json(
      { error: 'Failed to create property' },
      { status: 500 }
    )
  }
}
