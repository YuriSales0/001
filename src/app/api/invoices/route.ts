import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { sendEmail, invoiceCreatedEmail } from '@/lib/email'

const DASHBOARD_URL = process.env.NEXTAUTH_URL || 'https://hostmasters.es'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { error, status, user } = await requireRole(['ADMIN', 'MANAGER', 'CLIENT'])
  if (error) return NextResponse.json({ error }, { status })
  const me = user!
  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get('clientId')

  const where: Record<string, unknown> = {}
  if (me.role === 'CLIENT') where.clientId = me.id
  else if (me.role === 'MANAGER') where.client = { managerId: me.id }
  else if (clientId) where.clientId = clientId

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      client: { select: { id: true, name: true, email: true } },
      property: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(invoices)
}

export async function POST(req: NextRequest) {
  const { error, status, user } = await requireRole(['ADMIN', 'MANAGER'])
  if (error) return NextResponse.json({ error }, { status })
  const me = user!
  try {
    const { clientId, propertyId, description, amount, dueDate, notes } = await req.json()
    if (!clientId || !description || amount == null) {
      return NextResponse.json({ error: 'clientId, description and amount required' }, { status: 400 })
    }

    // Manager can only invoice their own clients
    if (me.role === 'MANAGER') {
      const client = await prisma.user.findUnique({ where: { id: clientId } })
      if (!client || client.managerId !== me.id) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 })
      }
    }

    const invoice = await prisma.invoice.create({
      data: {
        clientId,
        propertyId: propertyId || null,
        createdById: me.id,
        description,
        amount: Number(amount),
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes || null,
      },
      include: { client: { select: { name: true, email: true } } },
    })

    // Send invoice email to client
    if (invoice.client?.email) {
      await sendEmail({
        to: invoice.client.email,
        subject: `Invoice from HostMasters`,
        html: invoiceCreatedEmail({
          clientName: invoice.client.name || invoice.client.email,
          invoiceId: invoice.id,
          description: invoice.description,
          amount: invoice.amount,
          currency: invoice.currency,
          dueDate: invoice.dueDate?.toISOString() ?? null,
          notes: invoice.notes,
          dashboardUrl: `${DASHBOARD_URL}/client/payouts`,
        }),
      }).catch(e => console.error('Email send error:', e))
    }

    return NextResponse.json(invoice, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
  }
}
