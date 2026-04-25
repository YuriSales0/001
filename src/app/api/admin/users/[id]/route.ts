import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { requireRole, getCurrentUser } from '@/lib/session'
import { PLAN_COMMISSION, DEFAULT_COMMISSION_RATE } from '@/lib/finance'

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
      // Block role reassignment involving CLIENT — clients must stay clients,
      // and staff cannot be demoted to CLIENT (creates orphaned properties/leads).
      const existing = await prisma.user.findUnique({ where: { id: params.id }, select: { role: true } })
      if (existing?.role === 'CLIENT' && body.role !== 'CLIENT') {
        return NextResponse.json({ error: 'Cannot change a CLIENT to another role — contact support' }, { status: 400 })
      }
      if (existing?.role !== 'CLIENT' && body.role === 'CLIENT') {
        return NextResponse.json({ error: 'Cannot promote staff to CLIENT — create a new client account instead' }, { status: 400 })
      }
      data.role = body.role
    }
    if (body.subscriptionPlan !== undefined) {
      if (body.subscriptionPlan && !PLANS.includes(body.subscriptionPlan)) {
        return NextResponse.json({ error: 'invalid plan' }, { status: 400 })
      }
      data.subscriptionPlan = body.subscriptionPlan || null
    }
    if (body.password) {
      data.password = await bcrypt.hash(body.password, 12)
    }

    // Load current state so we can detect actual changes
    const before = await prisma.user.findUnique({
      where: { id: params.id },
      select: { role: true, subscriptionPlan: true },
    })
    if (!before) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const newPlan =
      body.subscriptionPlan !== undefined ? (body.subscriptionPlan || null) : before.subscriptionPlan
    const newRole = body.role !== undefined ? body.role : before.role
    const planChanged = body.subscriptionPlan !== undefined && newPlan !== before.subscriptionPlan
    const roleChanged = body.role !== undefined && newRole !== before.role

    const user = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({ where: { id: params.id }, data })

      // Bug 4: if plan changed on a CLIENT, recalc commission on SCHEDULED payouts
      // for that client's properties using the new plan's rate.
      if (planChanged && newRole === 'CLIENT') {
        const rate = PLAN_COMMISSION[newPlan ?? ''] ?? DEFAULT_COMMISSION_RATE
        const ratePct = +(rate * 100).toFixed(1)
        const scheduled = await tx.payout.findMany({
          where: { status: 'SCHEDULED', property: { ownerId: params.id } },
          select: { id: true, grossAmount: true },
        })
        for (const p of scheduled) {
          const commission = +(p.grossAmount * rate).toFixed(2)
          const netAmount = +(p.grossAmount - commission).toFixed(2)
          await tx.payout.update({
            where: { id: p.id },
            data: { commission, commissionRate: ratePct, netAmount },
          })
        }
      }

      return updated
    })

    // Bug 5: if role changed, invalidate all active NextAuth sessions for this user
    if (roleChanged) {
      await prisma.session.deleteMany({ where: { userId: params.id } })
    }

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
