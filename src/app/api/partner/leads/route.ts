import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPartnerFromCookie } from '@/lib/partner-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const partner = await getPartnerFromCookie()
  if (!partner) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const leads = await prisma.lead.findMany({
      where: { partnerId: partner.id } as Record<string, unknown>,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json(leads)
  } catch (error) {
    console.error('[Partner Leads] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
