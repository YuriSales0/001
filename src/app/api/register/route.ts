import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { verificationEmail } from '@/lib/email-verification'
import { normalizeEmailLocale, verificationI18n } from '@/lib/email-i18n'
import { notify } from '@/lib/notifications'
import { ensureClientMasterContract } from '@/lib/contracts'

const APP_URL = process.env.NEXTAUTH_URL || 'https://hostmasters.es'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, phone, language, ref } = await req.json()
    if (!email || !password || password.length < 6) {
      return NextResponse.json({ error: 'Email and password (min 6 chars) required' }, { status: 400 })
    }
    const normalizedEmail = email.toLowerCase().trim()
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      // Return same success response to prevent email enumeration
      return NextResponse.json({ ok: true, id: 'existing' })
    }

    // Resolve referral code → managerId
    let managerId: string | null = null
    if (ref && typeof ref === 'string') {
      const referringManager = await prisma.user.findUnique({
        where: { referralCode: ref.trim().toLowerCase() },
        select: { id: true, role: true },
      })
      if (referringManager && referringManager.role === 'MANAGER') {
        managerId = referringManager.id
      }
    }

    const hash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name || null,
        password: hash,
        phone: phone || null,
        language: language || 'en',
        role: 'CLIENT',
        subscriptionPlan: 'STARTER',
        managerId,
        emailVerified: null,
      },
    })

    // Generate Master Service Agreement (DRAFT, unsigned) so the client
    // never has an active subscription without a contract on file.
    ensureClientMasterContract({ userId: user.id, plan: 'STARTER', ownerName: user.name })
      .catch(err => console.error('[Register] Failed to generate master contract:', err))

    // Issue verification token (24h) + send email
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
    await prisma.verificationToken.create({
      data: { identifier: normalizedEmail, token, expires },
    })

    const verifyUrl = `${APP_URL}/verify-email?token=${token}`
    const userLocale = normalizeEmailLocale(language)
    sendEmail({
      to: normalizedEmail,
      subject: verificationI18n.subject[userLocale],
      html: verificationEmail({ name: name ?? normalizedEmail, verifyUrl, locale: userLocale }),
    }).catch(err => console.error('Verification email failed:', err))

    // Notify Manager if client was referred
    if (managerId) {
      notify({
        userId: managerId,
        type: 'CLIENT_REGISTERED',
        title: 'New client registered',
        body: `${name ?? normalizedEmail} signed up via your referral link`,
        link: '/manager/clients',
      }).catch(() => {})
    }

    return NextResponse.json({ ok: true, id: user.id, verificationSent: true })
  } catch (e) {
    console.error('register error', e)
    return NextResponse.json({ error: 'Failed to register' }, { status: 500 })
  }
}
