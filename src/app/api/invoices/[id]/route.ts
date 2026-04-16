import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { sendEmail, invoiceCreatedEmail, invoicePaidEmail } from '@/lib/email'

const DASHBOARD_URL = process.env.NEXTAUTH_URL || 'https://hostmasters.es'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!
  try {
    const { status } = await req.json() as { status?: 'DRAFT' | 'SENT' | 'PAID' | 'CANCELLED' }
    if (!status) return NextResponse.json({ error: 'status required' }, { status: 400 })

    // Managers can only modify invoices they created
    if (me.role === 'MANAGER') {
      const existing = await prisma.invoice.findUnique({ where: { id: params.id } })
      if (!existing || existing.createdById !== me.id) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 })
      }
    }

    const data: Record<string, unknown> = { status }
    if (status === 'PAID') data.paidAt = new Date()

    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data,
      include: { client: { select: { name: true, email: true } } },
    })

    // Send thank-you email when marked paid
    if (status === 'PAID' && invoice.client?.email) {
      await sendEmail({
        to: invoice.client.email,
        subject: `Payment confirmed — HostMasters`,
        html: invoicePaidEmail({
          clientName: invoice.client.name || invoice.client.email,
          invoiceId: invoice.id,
          description: invoice.description,
          amount: invoice.amount,
          currency: invoice.currency,
          paidAt: invoice.paidAt?.toISOString(),
          dashboardUrl: `${DASHBOARD_URL}/client/payouts`,
        }),
      }).catch(e => console.error('Email send error:', e))
    }

    return NextResponse.json(invoice)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!
  try {
    const { description, amount, dueDate, notes, propertyId } = await req.json()
    if (!description || amount == null) {
      return NextResponse.json({ error: 'description and amount required' }, { status: 400 })
    }

    // Managers can only edit invoices they created
    if (me.role === 'MANAGER') {
      const existing = await prisma.invoice.findUnique({ where: { id: params.id } })
      if (!existing || existing.createdById !== me.id) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 })
      }
    }

    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: {
        description,
        amount: Number(amount),
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes || null,
        propertyId: propertyId || null,
      },
      include: { client: { select: { id: true, name: true, email: true } } },
    })
    return NextResponse.json(invoice)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!
  try {
    // Managers can only delete invoices they created
    if (me.role === 'MANAGER') {
      const existing = await prisma.invoice.findUnique({ where: { id: params.id } })
      if (!existing || existing.createdById !== me.id) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 })
      }
    }
    await prisma.invoice.delete({ where: { id: params.id } })
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 })
  }
}
