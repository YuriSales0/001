import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/set-password
 * Body: { token, password }
 *
 * Used by invited Manager/Crew to set their initial password.
 * Token format: identifier="set-password:<userId>", single-use, 24h expiry.
 * Also marks emailVerified=now (since admin already vetted the application).
 */
export async function POST(request: NextRequest) {
  let body: { token?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { token, password } = body
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const record = await prisma.verificationToken.findUnique({ where: { token } })
  if (!record) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
  }
  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } }).catch(() => {})
    return NextResponse.json({ error: 'Token has expired' }, { status: 400 })
  }
  if (!record.identifier.startsWith('set-password:')) {
    return NextResponse.json({ error: 'Invalid token type' }, { status: 400 })
  }

  const userId = record.identifier.slice('set-password:'.length)
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const hashed = await bcrypt.hash(password, 10)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { password: hashed, emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({ where: { token } }),
  ])

  return NextResponse.json({ ok: true, email: user.email })
}
