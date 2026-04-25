import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/broadcasts/[id]/threads
 * Returns all reply threads for this broadcast, grouped by threadOwner (subscriber).
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const replies = await prisma.broadcastReply.findMany({
    where: { broadcastId: params.id },
    orderBy: { createdAt: 'asc' },
    include: {
      threadOwner: { select: { id: true, name: true, email: true, image: true } },
      author: { select: { id: true, name: true, email: true, role: true } },
    },
  })

  // Group by threadOwnerId
  const byOwner = new Map<string, {
    owner: typeof replies[number]['threadOwner']
    messages: typeof replies
    lastAt: Date
    unreadFromClient: number
  }>()

  for (const r of replies) {
    if (!byOwner.has(r.threadOwnerId)) {
      byOwner.set(r.threadOwnerId, {
        owner: r.threadOwner,
        messages: [],
        lastAt: r.createdAt,
        unreadFromClient: 0,
      })
    }
    const t = byOwner.get(r.threadOwnerId)!
    t.messages.push(r)
    if (r.createdAt > t.lastAt) t.lastAt = r.createdAt
    if (r.author.role === 'CLIENT' && !r.readAt) t.unreadFromClient++
  }

  const threads = Array.from(byOwner.values()).sort(
    (a, b) => b.lastAt.getTime() - a.lastAt.getTime(),
  )

  return NextResponse.json(threads)
}
