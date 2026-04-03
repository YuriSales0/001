import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ownerId = searchParams.get('ownerId')

    const properties = await prisma.property.findMany({
      where: ownerId ? { ownerId } : undefined,
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
  try {
    const body = await request.json()
    const { name, address, city, postalCode, description, photos, ownerId, commissionRate } = body

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
