import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

/** POST — start impersonating a user */
export async function POST(request: NextRequest) {
  const me = await getCurrentUser()
  if (!me?.isSuperUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId } = await request.json()
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  })
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const response = NextResponse.json({ ok: true, user: target })
  response.cookies.set('hm_view_as', JSON.stringify({ userId: target.id, name: target.name, email: target.email, role: target.role }), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours
  })
  return response
}

/** DELETE — stop impersonating */
export async function DELETE() {
  const me = await getCurrentUser()
  if (!me?.isSuperUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const response = NextResponse.json({ ok: true })
  response.cookies.delete('hm_view_as')
  return response
}
