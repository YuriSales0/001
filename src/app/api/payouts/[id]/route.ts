import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { status } = body as { status?: 'SCHEDULED' | 'PAID' | 'CANCELLED' }
    if (!status) return NextResponse.json({ error: 'status required' }, { status: 400 })

    const data: Record<string, unknown> = { status }
    if (status === 'PAID') data.paidAt = new Date()

    const payout = await prisma.payout.update({ where: { id: params.id }, data })
    return NextResponse.json(payout)
  } catch (error) {
    console.error('Error updating payout:', error)
    return NextResponse.json({ error: 'Failed to update payout' }, { status: 500 })
  }
}
