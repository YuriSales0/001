import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function GET() {
  const result: Record<string, unknown> = {
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasAdminEmail: !!process.env.ADMIN_EMAIL,
    hasAdminPassword: !!process.env.ADMIN_PASSWORD,
    adminEmail: process.env.ADMIN_EMAIL || null,
    nodeEnv: process.env.NODE_ENV,
  }

  try {
    if (!prisma) {
      result.prismaClient = 'null'
      return NextResponse.json(result)
    }
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, password: true },
    })
    result.userCount = users.length
    result.users = users.map(u => ({
      email: u.email,
      role: u.role,
      hasPassword: !!u.password,
    }))
  } catch (e) {
    result.dbError = e instanceof Error ? e.message : String(e)
  }

  return NextResponse.json(result)
}

// POST: force-create admin from env vars
export async function POST() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password) {
    return NextResponse.json({ error: 'ADMIN_EMAIL or ADMIN_PASSWORD not set' }, { status: 400 })
  }
  if (!prisma) {
    return NextResponse.json({ error: 'prisma client not available' }, { status: 500 })
  }
  try {
    const hash = await bcrypt.hash(password, 10)
    const user = await prisma.user.upsert({
      where: { email: email.toLowerCase() },
      update: { role: 'ADMIN', password: hash },
      create: {
        email: email.toLowerCase(),
        name: 'Hostmaster Admin',
        role: 'ADMIN',
        password: hash,
        language: 'en',
      },
    })
    return NextResponse.json({ ok: true, id: user.id, email: user.email })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    )
  }
}
