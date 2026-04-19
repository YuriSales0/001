import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

/**
 * GET /api/group-chats — list groups the user belongs to
 * POST /api/group-chats — Admin creates a group (or auto-seeds system groups)
 */
export async function GET(req: NextRequest) {
  const guard = await requireRole(['ADMIN', 'MANAGER', 'CREW'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  // Auto-seed system groups if they don't exist (Admin only)
  if (me.role === 'ADMIN') {
    await ensureSystemGroups()
  }

  const groups = await prisma.groupChat.findMany({
    where: {
      members: { some: { userId: me.id } },
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, role: true, isCaptain: true } } },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { body: true, createdAt: true, sender: { select: { name: true } } },
      },
      _count: { select: { messages: true, members: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(groups)
}

export async function POST(req: NextRequest) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const body = await req.json()
  const { name, type, description, memberIds } = body as {
    name?: string; type?: string; description?: string; memberIds?: string[]
  }

  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const group = await prisma.groupChat.create({
    data: {
      name,
      type: (type as 'MANAGERS' | 'CREW_OPS' | 'CUSTOM') ?? 'CUSTOM',
      description: description ?? null,
      members: {
        create: (memberIds ?? []).map(userId => ({ userId, role: 'MEMBER' })),
      },
    },
  })

  return NextResponse.json(group, { status: 201 })
}

/**
 * Auto-create the 2 system groups if they don't exist:
 * 1. "Managers" — all MANAGER users + all ADMIN users
 * 2. "Crew Operations" — all CREW users + Captain + all ADMIN users
 */
async function ensureSystemGroups() {
  const [admins, managers, crews] = await Promise.all([
    prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } }),
    prisma.user.findMany({ where: { role: 'MANAGER' }, select: { id: true } }),
    prisma.user.findMany({ where: { role: 'CREW' }, select: { id: true } }),
  ])

  // Managers group
  const mgrGroup = await prisma.groupChat.findFirst({ where: { type: 'MANAGERS' } })
  if (!mgrGroup) {
    const allIds = [...admins.map(a => a.id), ...managers.map(m => m.id)]
    if (allIds.length > 0) {
      await prisma.groupChat.create({
        data: {
          name: 'Managers',
          type: 'MANAGERS',
          description: 'All Managers + Admin — general announcements',
          members: {
            create: allIds.map(userId => ({
              userId,
              role: admins.some(a => a.id === userId) ? 'ADMIN' : 'MEMBER',
            })),
          },
        },
      })
    }
  } else {
    // Sync members — add any new managers/admins not yet in the group
    const existing = await prisma.groupChatMember.findMany({
      where: { chatId: mgrGroup.id },
      select: { userId: true },
    })
    const existingIds = new Set(existing.map(e => e.userId))
    const allIds = [...admins.map(a => a.id), ...managers.map(m => m.id)]
    const missing = allIds.filter(id => !existingIds.has(id))
    if (missing.length > 0) {
      await prisma.groupChatMember.createMany({
        data: missing.map(userId => ({
          chatId: mgrGroup.id,
          userId,
          role: admins.some(a => a.id === userId) ? 'ADMIN' : 'MEMBER',
        })),
        skipDuplicates: true,
      })
    }
  }

  // Crew Ops group
  const crewGroup = await prisma.groupChat.findFirst({ where: { type: 'CREW_OPS' } })
  if (!crewGroup) {
    const allIds = [...admins.map(a => a.id), ...crews.map(c => c.id)]
    if (allIds.length > 0) {
      await prisma.groupChat.create({
        data: {
          name: 'Crew Operations',
          type: 'CREW_OPS',
          description: 'All Crew + Captain + Admin — operational coordination',
          members: {
            create: allIds.map(userId => ({
              userId,
              role: admins.some(a => a.id === userId) ? 'ADMIN' : 'MEMBER',
            })),
          },
        },
      })
    }
  } else {
    const existing = await prisma.groupChatMember.findMany({
      where: { chatId: crewGroup.id },
      select: { userId: true },
    })
    const existingIds = new Set(existing.map(e => e.userId))
    const allIds = [...admins.map(a => a.id), ...crews.map(c => c.id)]
    const missing = allIds.filter(id => !existingIds.has(id))
    if (missing.length > 0) {
      await prisma.groupChatMember.createMany({
        data: missing.map(userId => ({
          chatId: crewGroup.id,
          userId,
          role: admins.some(a => a.id === userId) ? 'ADMIN' : 'MEMBER',
        })),
        skipDuplicates: true,
      })
    }
  }
}
