import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/health
 *
 * Lightweight health check for uptime monitoring.
 * Returns: { ok, db, time, uptime }
 *  - ok: true unless something critical fails
 *  - db: true if DB roundtrip succeeds within 2s
 *  - time: ISO timestamp
 *  - uptime: process uptime in seconds
 */
export async function GET() {
  const start = Date.now()
  let dbOk = false
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000)),
    ])
    dbOk = true
  } catch {
    dbOk = false
  }

  const body = {
    ok: dbOk,
    db: dbOk,
    time: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    latencyMs: Date.now() - start,
  }

  return NextResponse.json(body, { status: dbOk ? 200 : 503 })
}
