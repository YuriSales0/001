import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

// NOTE: Suppliers are intentionally a shared global resource — no role-scoping needed.
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { name, type, phone, email, notes } = body

  const data: Record<string, unknown> = {}
  if (name  !== undefined) data.name  = name
  if (type  !== undefined) data.type  = type
  if (phone !== undefined) data.phone = phone
  if (email !== undefined) data.email = email ?? null
  if (notes !== undefined) data.notes = notes ?? null

  const supplier = await prisma.supplier.update({
    where: { id: params.id },
    data,
    include: {
      properties: {
        include: { property: { select: { id: true, name: true, city: true } } },
      },
    },
  })
  return NextResponse.json(supplier)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  await prisma.supplier.delete({ where: { id: params.id } })
  return new NextResponse(null, { status: 204 })
}
