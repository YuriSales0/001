import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

/**
 * DELETE /api/pricing-data — clear all PricingDataPoints
 * Admin only. Use to reset demo/test data.
 */
export async function DELETE() {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const deleted = await prisma.pricingDataPoint.deleteMany({})
  return NextResponse.json({ deleted: deleted.count })
}
