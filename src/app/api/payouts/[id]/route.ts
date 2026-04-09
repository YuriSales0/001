import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { sendEmail, ownerStatementEmail } from '@/lib/email'

const DASHBOARD_URL = process.env.NEXTAUTH_URL || 'https://hostmasters.es'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
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
            owner: { select: { name: true, email: true } },
          },
        },
        reservation: {
          select: { guestName: true, checkIn: true, checkOut: true },
        },
      },
    })

    // Send Owner Statement email when payout is marked PAID
    if (status === 'PAID' && payout.property?.owner?.email) {
      const owner = payout.property.owner
      await sendEmail({
        to: owner.email,
        subject: `Owner Statement — ${payout.property.name}`,
        html: ownerStatementEmail({
          ownerName: owner.name || owner.email,
          propertyName: payout.property.name,
          payoutId: payout.id,
          grossAmount: payout.grossAmount,
          commission: payout.commission,
          commissionRate: payout.commissionRate,
          netAmount: payout.netAmount,
          currency: 'EUR',
          paidAt: payout.paidAt?.toISOString() ?? new Date().toISOString(),
          guestName: payout.reservation.guestName,
          checkIn: payout.reservation.checkIn.toISOString(),
          checkOut: payout.reservation.checkOut.toISOString(),
          platform: payout.platform,
          dashboardUrl: `${DASHBOARD_URL}/client/payouts`,
        }),
      }).catch(e => console.error('Owner statement email error:', e))
    }

    return NextResponse.json(payout)
  } catch (error) {
    console.error('Error updating payout:', error)
    return NextResponse.json({ error: 'Failed to update payout' }, { status: 500 })
  }
}
