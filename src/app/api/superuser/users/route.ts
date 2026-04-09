import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  const me = await getCurrentUser()
  if (!me?.isSuperUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true },
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
  })

  // Group by role
  const grouped = users.reduce((acc, u) => {
    const r = u.role as string
    if (!acc[r]) acc[r] = []
    acc[r].push(u)
    return acc
  }, {} as Record<string, typeof users>)

  return NextResponse.json(grouped)
}
