import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

/**
 * POST /api/profile/2fa
 * Body: { enable: boolean, password: string }
 *
 * Toggles 2FA for the authenticated user. Requires password confirmation
 * (re-authentication) to prevent CSRF + session-hijack attempts from
 * silently disabling 2FA.
 */
export async function POST(request: NextRequest) {
  const guard = await requireRole(['ADMIN', 'MANAGER', 'CREW', 'CLIENT'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  let body: { enable?: boolean; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (typeof body.enable !== 'boolean' || !body.password) {
    return NextResponse.json({ error: 'enable + password required' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: me.id },
    select: { id: true, password: true, twoFactorEnabled: true },
  })
  if (!user || !user.password) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const ok = await bcrypt.compare(body.password, user.password)
  if (!ok) {
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 })
  }

  if (user.twoFactorEnabled === body.enable) {
    // No-op
    return NextResponse.json({ ok: true, twoFactorEnabled: body.enable })
  }

  await prisma.user.update({
    where: { id: me.id },
    data: {
      twoFactorEnabled: body.enable,
      twoFactorMethod: body.enable ? 'EMAIL' : null,
    },
  })

  // Cleanup any stale 2FA codes when disabling
  if (!body.enable) {
    await prisma.verificationToken.deleteMany({
      where: { identifier: `2fa:${me.id}` },
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true, twoFactorEnabled: body.enable })
}
