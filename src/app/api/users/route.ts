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
  if (me.role === 'MANAGER') {
    where.role = 'CLIENT'
    where.managerId = me.id
  }

  const users = await prisma.user.findMany({
    where,
    select: { id: true, name: true, email: true, role: true, phone: true, managerId: true } as never,
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(users)
}
