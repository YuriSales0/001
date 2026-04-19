import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const guard = await requireRole(['CLIENT', 'ADMIN', 'MANAGER', 'CREW'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const { id, name, email, role } = guard.user!

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      subscriptionPlan: true,
      crewContractType: true,
      crewMonthlyRate: true,
      crewTaskRate: true,
    },
  })

  const base = { id, name, email, role, subscriptionPlan: user?.subscriptionPlan ?? null }

  // Include crew-specific fields for CREW users
  if (role === 'CREW') {
    return NextResponse.json({
      ...base,
      crewContractType: user?.crewContractType ?? null,
      crewMonthlyRate: user?.crewMonthlyRate ?? null,
      crewTaskRate: user?.crewTaskRate ?? null,
    })
  }

  return NextResponse.json(base)
}
