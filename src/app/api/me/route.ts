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
    select: { subscriptionPlan: true },
  })

  return NextResponse.json({ id, name, email, role, subscriptionPlan: user?.subscriptionPlan ?? null })
}
