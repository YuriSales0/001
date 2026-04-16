import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, phone, language } = await req.json()
    if (!email || !password || password.length < 6) {
      return NextResponse.json({ error: 'Email and password (min 6 chars) required' }, { status: 400 })
    }
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) {
      // Return same success response to prevent email enumeration
      return NextResponse.json({ ok: true, id: 'existing' })
    }

    const hash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: name || null,
        password: hash,
        phone: phone || null,
        language: language || 'en',
        role: 'CLIENT',
      },
    })
    return NextResponse.json({ ok: true, id: user.id })
  } catch (e) {
    console.error('register error', e)
    return NextResponse.json({ error: 'Failed to register' }, { status: 500 })
  }
}
