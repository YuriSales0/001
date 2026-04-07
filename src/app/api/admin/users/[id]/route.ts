import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { requireRole, getCurrentUser } from '@/lib/session'

const ROLES = ['ADMIN', 'MANAGER', 'CREW', 'CLIENT'] as const
const PLANS = ['BASIC', 'MID', 'PREMIUM'] as const

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  try {
    const body = await req.json()
    const data: Record<string, unknown> = {}
    if (body.name !== undefined) data.name = body.name
    if (body.email !== undefined) data.email = String(body.email).toLowerCase()
    if (body.phone !== undefined) data.phone = body.phone
    if (body.language !== undefined) data.language = body.language
    if (body.managerId !== undefined) data.managerId = body.managerId || null
    if (body.role !== undefined) {
      if (!ROLES.includes(body.role)) return NextResponse.json({ error: 'invalid role' }, { status: 400 })
      data.role = body.role
    }
    if (body.subscriptionPlan !== undefined) {
      if (body.subscriptionPlan && !PLANS.includes(body.subscriptionPlan)) {
        return NextResponse.json({ error: 'invalid plan' }, { status: 400 })
      }
      data.subscriptionPlan = body.subscriptionPlan || null
    }
    if (body.password) {
      data.password = await bcrypt.hash(body.password, 10)
    }
    const user = await prisma.user.update({ where: { id: params.id }, data })
    return NextResponse.json({ ok: true, id: user.id })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = await getCurrentUser()
  if (me?.id === params.id) {
    return NextResponse.json({ error: 'cannot delete your own account' }, { status: 400 })
  }
  try {
    await prisma.user.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: 'Failed to delete (user may have related records — remove them first)' },
      { status: 500 },
    )
  }
}
