import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Find partner by email
    // @ts-expect-error Partner model pending prisma generate
    const partner = await prisma.partner.findFirst({
      where: { email: email.toLowerCase(), status: 'ACTIVE' },
      select: { id: true, name: true, email: true },
    })

    if (!partner) {
      // Don't reveal whether partner exists — return success anyway
      return NextResponse.json({ ok: true })
    }

    // Generate a magic link token
    const loginToken = randomBytes(32).toString('hex')

    // Save token to partner
    // @ts-expect-error Partner model pending prisma generate
    await prisma.partner.update({
      where: { id: partner.id },
      data: { loginToken },
    })

    // In production, this would send an email via Resend with the magic link:
    // const magicLink = `${process.env.NEXTAUTH_URL}/partner?token=${loginToken}`
    // await resend.emails.send({ to: partner.email, subject: 'Your HostMasters Partner Portal Login', ... })
    //
    // For development, log the token
    console.log(`[Partner Auth] Magic link token for ${partner.email}: ${loginToken}`)
    console.log(`[Partner Auth] Login URL: /partner?token=${loginToken}`)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[Partner Auth] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
