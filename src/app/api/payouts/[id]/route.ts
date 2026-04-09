import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { sendEmail, ownerStatementEmail, invoicePaidEmail } from '@/lib/email'

const DASHBOARD_URL = process.env.NEXTAUTH_URL || 'https://hostmasters.es'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  try {
    const body = await request.json()
    const { status } = body as { status?: 'SCHEDULED' | 'PAID' | 'CANCELLED' }
    if (!status) return NextResponse.json({ error: 'status required' }, { status: 400 })

    const data: Record<string, unknown> = { status }
    if (status === 'PAID') data.paidAt = new Date()

    const payout = await prisma.payout.update({
      where: { id: params.id },
      data,
      include: {
        property: {
          select: {
            name: true,
            owner: { select: { id: true, name: true, email: true } },
          },
        },
        reservation: {
          select: { guestName: true, checkIn: true, checkOut: true },
        },
      },
    })

    if (status === 'PAID') {
      const owner = payout.property?.owner
      const paidAt = payout.paidAt ?? new Date()
      const checkInStr  = payout.reservation.checkIn.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      const checkOutStr = payout.reservation.checkOut.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      const description = `Rental income — ${payout.property.name} · ${payout.reservation.guestName} (${checkInStr}–${checkOutStr})`

      // Auto-create Invoice for the owner
      let invoice = null
      if (owner?.id) {
        invoice = await prisma.invoice.create({
          data: {
            clientId:    owner.id,
            createdById: me.id,
            description,
            amount:   payout.netAmount,
            currency: 'EUR',
            status:   'PAID',
            paidAt,
            notes: `Auto-generated from payout ${payout.id}`,
          },
        }).catch(e => { console.error('Invoice auto-create error:', e); return null })
      }

      // Send Owner Statement email
      if (owner?.email) {
        await sendEmail({
          to: owner.email,
          subject: `Owner Statement — ${payout.property.name}`,
          html: ownerStatementEmail({
            ownerName:      owner.name || owner.email,
            propertyName:   payout.property.name,
            payoutId:       payout.id,
            grossAmount:    payout.grossAmount,
            commission:     payout.commission,
            commissionRate: payout.commissionRate,
            netAmount:      payout.netAmount,
            currency:       'EUR',
            paidAt:         paidAt.toISOString(),
            guestName:      payout.reservation.guestName,
            checkIn:        payout.reservation.checkIn.toISOString(),
            checkOut:       payout.reservation.checkOut.toISOString(),
            platform:       payout.platform,
            dashboardUrl:   `${DASHBOARD_URL}/client/payouts`,
          }),
        }).catch(e => console.error('Owner statement email error:', e))

        // Send invoice confirmation email
        if (invoice) {
          await sendEmail({
            to: owner.email,
            subject: `Payment confirmed — ${payout.property.name}`,
            html: invoicePaidEmail({
              clientName:  owner.name || owner.email,
              invoiceId:   invoice.id,
              description,
              amount:      payout.netAmount,
              currency:    'EUR',
              paidAt:      paidAt.toISOString(),
              dashboardUrl: `${DASHBOARD_URL}/client/payouts`,
            }),
          }).catch(e => console.error('Invoice email error:', e))
        }
      }
    }

    return NextResponse.json(payout)
  } catch (error) {
    console.error('Error updating payout:', error)
    return NextResponse.json({ error: 'Failed to update payout' }, { status: 500 })
  }
}
