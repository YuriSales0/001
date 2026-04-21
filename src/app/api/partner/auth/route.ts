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
    await prisma.partner.update({
      where: { id: partner.id },
      data: { loginToken },
    })

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Partner Auth] Login URL: /partner?token=${loginToken}`)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[Partner Auth] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
