import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  let body: { email?: string }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  if (!body.email) return NextResponse.json({ unverified: false })

  const user = await prisma.user.findUnique({
    where: { email: body.email.toLowerCase().trim() },
    select: { emailVerified: true },
  })

  // Don't reveal if email exists — only flag unverified if found
  if (user && !user.emailVerified) {
    return NextResponse.json({ unverified: true })
  }

  return NextResponse.json({ unverified: false })
}
