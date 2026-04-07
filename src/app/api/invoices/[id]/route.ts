import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  try {
    const { status } = await req.json() as { status?: 'DRAFT' | 'SENT' | 'PAID' | 'CANCELLED' }
    if (!status) return NextResponse.json({ error: 'status required' }, { status: 400 })
    const data: Record<string, unknown> = { status }
    if (status === 'PAID') data.paidAt = new Date()
    const invoice = await prisma.invoice.update({ where: { id: params.id }, data })
    return NextResponse.json(invoice)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
