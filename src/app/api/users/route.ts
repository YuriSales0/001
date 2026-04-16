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
  // MANAGER restrictions: only see their own clients and shared CREW users
  if (me.role === 'MANAGER') {
    if (role === 'CREW') {
      where.role = 'CREW'
    } else {
      // Default: only their own clients (block access to ADMIN/MANAGER lists)
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
