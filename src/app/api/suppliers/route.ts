import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

// NOTE: Suppliers are intentionally a shared global resource (cleaning companies,
// plumbers, electricians, etc.) across the organization. MANAGER access to all
// suppliers is correct business logic — no role-scoping needed here.
export async function GET() {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const suppliers = await prisma.supplier.findMany({
    take: 200,
    include: {
      properties: {
        include: { property: { select: { id: true, name: true, city: true } } },
      },
    },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(suppliers)
}

export async function POST(request: NextRequest) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { name, type, phone, email, notes, propertyIds } = body

  if (!name || !type || !phone) {
    return NextResponse.json({ error: 'name, type and phone are required' }, { status: 400 })
  }

  const supplier = await prisma.supplier.create({
    data: {
      name,
      type,
      phone,
      email:  email || null,
      notes:  notes || null,
      properties: propertyIds?.length
        ? { create: propertyIds.map((propertyId: string) => ({ propertyId })) }
        : undefined,
    },
    include: {
      properties: {
        include: { property: { select: { id: true, name: true, city: true } } },
      },
    },
  })
  return NextResponse.json(supplier, { status: 201 })
}
