import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { verificationEmail } from '@/lib/email-verification'

const APP_URL = process.env.NEXTAUTH_URL || 'https://hostmasters.es'

/**
 * POST /api/auth/resend-verification
 * Body: { email }
 * Always returns ok to prevent enumeration.
 */
export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({}))
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }
  const normalized = email.toLowerCase().trim()

  const user = await prisma.user.findUnique({ where: { email: normalized } })
  if (!user || user.emailVerified) {
    // Silent success — avoids leaking which emails are registered / verified
    return NextResponse.json({ ok: true })
  }

  // Invalidate any previous pending tokens for this email
  await prisma.verificationToken.deleteMany({ where: { identifier: normalized } })

  const token = crypto.randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
  await prisma.verificationToken.create({
    data: { identifier: normalized, token, expires },
  })

  const verifyUrl = `${APP_URL}/verify-email?token=${token}`
  sendEmail({
    to: normalized,
    subject: 'Confirm your HostMasters account',
    html: verificationEmail({ name: user.name ?? normalized, verifyUrl }),
  }).catch(err => console.error('Resend verification failed:', err))

  return NextResponse.json({ ok: true })
}
