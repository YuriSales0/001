import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { error, status, user } = await requireRole(['ADMIN', 'MANAGER'])
  if (error) return NextResponse.json({ error }, { status })
  const me = user!
  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role')

  const where: Record<string, unknown> = {}
  if (role) where.role = role
  // MANAGER restrictions: only see their own clients; CREW are global so any role-filtered fetch is allowed
  if (me.role === 'MANAGER') {
    if (role === 'CLIENT' || !role) {
      where.role = 'CLIENT'
      where.managerId = me.id
    }
  }

  const users = await prisma.user.findMany({
    where,
    select: { id: true, name: true, email: true, role: true, phone: true, managerId: true },
    orderBy: { name: 'asc' },
    take: 500,
  })
  return NextResponse.json(users)
}
