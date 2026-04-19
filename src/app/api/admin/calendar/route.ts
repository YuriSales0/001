import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

export type CalendarEvent = {
  id: string
  type: 'CHECK_IN' | 'CHECK_OUT' | 'BLOCKED' | 'TASK' | 'PAYOUT' | 'BIRTHDAY'
  title: string
  date: string
  endDate?: string
  property?: { id: string; name: string }
  meta?: Record<string, unknown>
}

export async function GET(req: NextRequest) {
  const guard = await requireRole(['ADMIN', 'MANAGER', 'CREW'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!
  const { searchParams } = new URL(req.url)
  const fromStr = searchParams.get('from')
  const toStr = searchParams.get('to')
  const from = fromStr ? new Date(fromStr) : new Date(new Date().setDate(1))
  const to = toStr ? new Date(toStr) : new Date(from.getFullYear(), from.getMonth() + 2, 0)

  // Build property filter for non-admin roles
  const propFilter = me.role === 'MANAGER'
    ? { owner: { managerId: me.id } }
    : me.role === 'CREW'
    ? { tasks: { some: { assigneeId: me.id } } }
    : undefined

  const taskWhere: Record<string, unknown> = { dueDate: { gte: from, lte: to } }
  if (me.role === 'MANAGER') taskWhere.property = { owner: { managerId: me.id } }
  else if (me.role === 'CREW') taskWhere.assigneeId = me.id

  const [reservations, blocks, tasks, payouts, birthdays] = await Promise.all([
    prisma.reservation.findMany({
      where: {
        OR: [{ checkIn: { gte: from, lte: to } }, { checkOut: { gte: from, lte: to } }],
        ...(propFilter ? { property: propFilter } : {}),
      },
      include: { property: { select: { id: true, name: true } } },
    }),
    prisma.blockedDate.findMany({
      where: {
        startDate: { gte: from, lte: to },
        ...(propFilter ? { property: propFilter } : {}),
      },
      include: { property: { select: { id: true, name: true } } },
    }),
    prisma.task.findMany({
      where: taskWhere,
      include: {
        property: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    }),
    // CREW should not see financial payout data
    me.role === 'CREW'
      ? Promise.resolve([])
      : prisma.payout.findMany({
          where: {
            scheduledFor: { gte: from, lte: to },
            ...(propFilter ? { property: propFilter } : {}),
          },
          include: { property: { select: { id: true, name: true } } },
        }),
    me.role === 'ADMIN'
      ? prisma.user.findMany({
          where: { birthday: { not: null }, role: 'CLIENT' },
          select: { id: true, name: true, email: true, birthday: true },
        })
      : Promise.resolve([]),
  ])

  const events: CalendarEvent[] = []

  for (const r of reservations) {
    if (r.checkIn >= from && r.checkIn <= to) {
      events.push({
        id: `ci-${r.id}`,
        type: 'CHECK_IN',
        title: `Check-in · ${r.guestName}`,
        date: r.checkIn.toISOString(),
        property: r.property,
      })
    }
    if (r.checkOut >= from && r.checkOut <= to) {
      events.push({
        id: `co-${r.id}`,
        type: 'CHECK_OUT',
        title: `Check-out · ${r.guestName}`,
        date: r.checkOut.toISOString(),
        property: r.property,
      })
    }
  }
  for (const b of blocks) {
    events.push({
      id: `bk-${b.id}`,
      type: 'BLOCKED',
      title: `Blocked${b.reason ? ` (${b.reason.split(':')[0]})` : ''}`,
      date: b.startDate.toISOString(),
      endDate: b.endDate.toISOString(),
      property: b.property,
    })
  }
  const now = new Date()
  for (const t of tasks) {
    const isOverdue = t.status !== 'COMPLETED' && t.dueDate < now
    events.push({
      id: `tk-${t.id}`,
      type: 'TASK',
      title: `${t.type.replace(/_/g, ' ')} · ${t.title}`,
      date: t.dueDate.toISOString(),
      property: t.property,
      meta: {
        taskId: t.id,
        taskType: t.type,
        taskStatus: t.status,
        isOverdue,
        assignee: t.assignee,
      },
    })
  }
  for (const p of payouts) {
    events.push({
      id: `po-${p.id}`,
      type: 'PAYOUT',
      title: `Payout €${p.netAmount.toFixed(0)}`,
      date: p.scheduledFor.toISOString(),
      property: p.property,
      meta: { status: p.status },
    })
  }
  // Birthdays — project to current year window
  for (const u of birthdays) {
    if (!u.birthday) continue
    const yr = from.getFullYear()
    const occ = new Date(yr, u.birthday.getMonth(), u.birthday.getDate())
    if (occ >= from && occ <= to) {
      events.push({
        id: `bd-${u.id}`,
        type: 'BIRTHDAY',
        title: `🎂 ${u.name || u.email}`,
        date: occ.toISOString(),
      })
    }
  }

  events.sort((a, b) => a.date.localeCompare(b.date))
  return NextResponse.json(events)
}
