import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

/**
 * TEMPORARY DEBUG ENDPOINT — REMOVE AFTER LOGIN ISSUE RESOLVED
 *
 * POST /api/debug-auth
 * Body: { email, password }
 *
 * Returns granular diagnostics about why login is failing:
 *  - userExists, isVerified, hasPassword, hashFormat, bcryptMatch
 */
export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 })
  }

  const email = (body.email || '').toLowerCase().trim()
  const password = body.password || ''

  if (!email) {
    return NextResponse.json({ error: 'email required' }, { status: 400 })
  }

  // Step 1: prisma client
  if (!prisma) {
    return NextResponse.json({ step: 'prisma', error: 'prisma client is null' })
  }

  // Step 2: total admin count
  const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } })

  // Step 3: lookup
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      role: true,
      emailVerified: true,
      password: true,
    },
  })

  if (!user) {
    return NextResponse.json({
      step: 'findUnique',
      result: 'not found',
      adminCountInDb: adminCount,
      lookedUpEmail: email,
    })
  }

  const hashFormat = user.password ? user.password.slice(0, 7) : null
  const hashLen = user.password?.length ?? 0
  let bcryptMatch: boolean | string = false
  if (user.password && password) {
    try {
      bcryptMatch = await bcrypt.compare(password, user.password)
    } catch (e) {
      bcryptMatch = `error: ${e instanceof Error ? e.message : String(e)}`
    }
  }

  return NextResponse.json({
    step: 'complete',
    userExists: true,
    role: user.role,
    isVerified: user.emailVerified !== null,
    hasPassword: !!user.password,
    hashFormat,
    hashLen,
    bcryptMatch,
    emailLookup: email,
    emailInDb: user.email,
    adminCountInDb: adminCount,
  })
}
