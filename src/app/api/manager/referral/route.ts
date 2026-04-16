import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

/**
 * GET /api/manager/referral — Manager reads (or auto-generates) their referral code
 */
export async function GET() {
  const guard = await requireRole(['MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const user = await prisma.user.findUnique({
    where: { id: me.id },
    select: { referralCode: true, managerZone: true, name: true, email: true },
  })
  if (!user) return NextResponse.json({ error: 'not found' }, { status: 404 })

  // Auto-generate on first fetch if missing
  let code = user.referralCode
  if (!code) {
    code = await generateUniqueCode(user.name ?? user.email.split('@')[0], user.managerZone)
    await prisma.user.update({
      where: { id: me.id },
      data: { referralCode: code },
    })
  }

  const base = process.env.NEXTAUTH_URL || 'https://hostmasters.es'
  const referralUrl = `${base}/?ref=${encodeURIComponent(code)}`

  // Leads currently assigned to this manager (proxy for referral attribution)
  const leadCount = await prisma.lead.count({
    where: { assignedManagerId: me.id },
  })

  const clientCount = await prisma.user.count({
    where: { role: 'CLIENT', managerId: me.id },
  })

  return NextResponse.json({
    referralCode: code,
    referralUrl,
    managerZone: user.managerZone,
    stats: { leadCount, clientCount },
  })
}

/**
 * PATCH /api/manager/referral — update code or zone (with uniqueness check)
 */
export async function PATCH(req: NextRequest) {
  const guard = await requireRole(['MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const body = await req.json() as { referralCode?: string; managerZone?: string }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {}

  if (body.referralCode !== undefined) {
    const code = slugify(body.referralCode)
    if (code.length < 3 || code.length > 40) {
      return NextResponse.json({ error: 'Code must be 3-40 characters' }, { status: 400 })
    }
    // Check uniqueness
    const existing = await prisma.user.findUnique({ where: { referralCode: code } })
    if (existing && existing.id !== me.id) {
      return NextResponse.json({ error: 'This code is already taken' }, { status: 409 })
    }
    data.referralCode = code
  }

  if (body.managerZone !== undefined) {
    data.managerZone = String(body.managerZone).trim().slice(0, 50) || null
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id: me.id },
    data,
    select: { referralCode: true, managerZone: true },
  })

  return NextResponse.json(updated)
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

async function generateUniqueCode(name: string, zone: string | null | undefined): Promise<string> {
  const baseName = slugify(name.split(' ')[0] ?? 'manager') || 'manager'
  const baseZone = zone ? slugify(zone) : null
  const candidates = baseZone
    ? [`${baseName}-${baseZone}`, baseName]
    : [baseName]

  // Try candidates, then append numeric suffix if taken
  for (const base of candidates) {
    const existing = await prisma.user.findUnique({ where: { referralCode: base } })
    if (!existing) return base
  }

  // Append random suffix
  for (let i = 0; i < 10; i++) {
    const suffix = Math.random().toString(36).slice(2, 5)
    const code = `${candidates[0]}-${suffix}`
    const existing = await prisma.user.findUnique({ where: { referralCode: code } })
    if (!existing) return code
  }

  // Fallback: use id-based code
  return `mgr-${Date.now().toString(36)}`
}
