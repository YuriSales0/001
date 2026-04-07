import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export async function GET(request: NextRequest) {
  const guard = await requireRole(['ADMIN', 'MANAGER', 'CLIENT', 'CREW'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const user = guard.user!
  try {
    const { searchParams } = new URL(request.url)
    const ownerId = searchParams.get('ownerId')

    const where: Record<string, unknown> = {}
    if (user.role === 'CLIENT') where.ownerId = user.id
    else if (user.role === 'MANAGER') where.owner = { managerId: user.id }
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
          },
        },
      },
      orderBy: { createdAt: 'desc' },
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
  const guard = await requireRole(['ADMIN', 'CLIENT'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!
  try {
    const body = await request.json()
    let { ownerId } = body
    const { name, address, city, postalCode, description, photos, commissionRate } = body
    if (me.role === 'CLIENT') ownerId = me.id

    if (!name || !address || !city || !ownerId) {
      return NextResponse.json(
        { error: 'Missing required fields: name, address, city, ownerId' },
        { status: 400 }
      )
    }

    const property = await prisma.property.create({
      data: {
        name,
        address,
        city,
        postalCode,
        description,
        photos: photos || [],
        ownerId,
        commissionRate: commissionRate ?? 18.0,
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

    return NextResponse.json(property, { status: 201 })
  } catch (error) {
    console.error('Error creating property:', error)
    return NextResponse.json(
      { error: 'Failed to create property' },
      { status: 500 }
    )
  }
}
