import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role')
  const users = await prisma.user.findMany({
    where: role ? { role: role as 'ADMIN' | 'MANAGER' | 'CREW' | 'CLIENT' } : undefined,
    select: {
      id: true, name: true, email: true, role: true, phone: true, language: true,
      managerId: true, subscriptionPlan: true, createdAt: true,
      manager: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  })
  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  try {
    const { name, email, password, role, phone, managerId } = await req.json()
    if (!email || !password || !role) {
      return NextResponse.json({ error: 'email, password and role required' }, { status: 400 })
    }
    if (!['ADMIN', 'MANAGER', 'CREW', 'CLIENT'].includes(role)) {
      return NextResponse.json({ error: 'invalid role' }, { status: 400 })
    }
    const hash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: name || null,
        password: hash,
        phone: phone || null,
        role,
        managerId: role === 'CLIENT' ? managerId || null : null,
      },
    })
    return NextResponse.json({ ok: true, id: user.id })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
