import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { verificationEmail } from '@/lib/email-verification'
import { normalizeEmailLocale, verificationI18n } from '@/lib/email-i18n'

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
  const userLocale = normalizeEmailLocale(user.language)
  sendEmail({
    to: normalized,
    subject: verificationI18n.subject[userLocale],
    html: verificationEmail({ name: user.name ?? normalized, verifyUrl, locale: userLocale }),
  }).catch(err => console.error('Resend verification failed:', err))

  return NextResponse.json({ ok: true })
}
