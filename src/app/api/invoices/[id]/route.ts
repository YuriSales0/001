import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireRole(['ADMIN', 'MANAGER', 'CLIENT'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: {
      client: { select: { id: true, name: true, email: true } },
      property: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  })
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (me.role === 'CLIENT' && invoice.clientId !== me.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return NextResponse.json(invoice)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireRole(['ADMIN', 'MANAGER', 'CLIENT'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const invoice = await prisma.invoice.findUnique({ where: { id: params.id } })
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Client can only mark their own invoice as paid (Stripe callback scenario)
  if (me.role === 'CLIENT') {
    if (invoice.clientId !== me.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const body = await req.json()
    if (body.status === 'PAID') {
      const updated = await prisma.invoice.update({
        where: { id: params.id },
        data: { status: 'PAID', paidAt: new Date() },
      })
      return NextResponse.json(updated)
    }
    return NextResponse.json({ error: 'Clients can only mark invoices as paid' }, { status: 403 })
  }

  // Admin/Manager
  try {
    const body = await req.json() as { status?: 'DRAFT' | 'SENT' | 'PAID' | 'CANCELLED' }
    if (!body.status) return NextResponse.json({ error: 'status required' }, { status: 400 })
    const data: Record<string, unknown> = { status: body.status }
    if (body.status === 'PAID') data.paidAt = new Date()
    const updated = await prisma.invoice.update({ where: { id: params.id }, data })
    return NextResponse.json(updated)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
