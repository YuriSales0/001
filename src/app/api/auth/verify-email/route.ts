import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/auth/verify-email?token=... — confirm a user's email address.
 * Returns JSON consumed by /verify-email page.
 */
export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Token missing' }, { status: 400 })

  const record = await prisma.verificationToken.findUnique({ where: { token } })
  if (!record) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } }).catch(() => {})
    return NextResponse.json({ error: 'This confirmation link has expired' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email: record.identifier } })
  if (!user) {
    await prisma.verificationToken.delete({ where: { token } }).catch(() => {})
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({ where: { token } }),
  ])

  return NextResponse.json({ ok: true, email: user.email })
}
