import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { triageAndPersist } from '@/lib/lead-triage'

export const dynamic = 'force-dynamic'

/**
 * POST /api/leads/[id]/triage
 * Force a re-triage of a lead. ADMIN or the assigned MANAGER only.
 */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    select: { assignedManagerId: true },
  })
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

  if (me.role === 'MANAGER' && lead.assignedManagerId !== me.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const triage = await triageAndPersist(params.id)
  if (!triage) {
    return NextResponse.json({ error: 'Triage failed (check ANTHROPIC_API_KEY)' }, { status: 500 })
  }

  return NextResponse.json(triage)
}
