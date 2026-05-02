import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { notify, tForUser } from '@/lib/notifications'
import { hasSignedMasterContract } from '@/lib/contracts'

/**
 * POST /api/properties/[id]/approve
 *
 * Admin approves property. The commercial relationship is already governed
 * by the Client's signed Master Service Agreement (created at register /
 * plan change), so we do not issue a per-property contract here.
 *
 * Flow: PENDING_APPROVAL → (approve) → ACTIVE (if master signed)
 *                                    → CONTRACT_PENDING (if master not yet signed)
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const property = await prisma.property.findUnique({
    where: { id: params.id },
    select: { id: true, status: true, photos: true, houseRules: true, smartLockId: true, ownerId: true, name: true },
  })
  if (!property) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if ((property.status as string) !== 'PENDING_APPROVAL') {
    return NextResponse.json({ error: 'Property is not pending approval' }, { status: 400 })
  }
  if (!property.photos || property.photos.length === 0) {
    return NextResponse.json({ error: 'Property must have at least 1 photo before approval' }, { status: 400 })
  }
  if (!property.houseRules || property.houseRules.length === 0) {
    return NextResponse.json({ error: 'Property must have house rules selected before approval' }, { status: 400 })
  }
  if (!property.smartLockId) {
    return NextResponse.json({ error: 'Smart Lock must be installed before approval' }, { status: 400 })
  }

  const masterSigned = await hasSignedMasterContract(property.ownerId)
  const nextStatus = masterSigned ? 'ACTIVE' : 'CONTRACT_PENDING'

  const updated = await prisma.property.update({
    where: { id: params.id },
    data: { status: nextStatus },
    select: { id: true, status: true },
  })

  Promise.all([
    tForUser(property.ownerId, 'notifications.propertyApprovedTitle', { name: property.name }),
    tForUser(property.ownerId, 'notifications.propertyApprovedBody'),
  ]).then(([title, body]) =>
    notify({
      userId: property.ownerId,
      type: masterSigned ? 'PROPERTY_ACTIVE' : 'PROPERTY_APPROVED',
      title,
      body,
      link: masterSigned ? '/client/dashboard' : '/client/contracts',
    })
  ).catch(() => {})

  return NextResponse.json({ ...updated, masterContractSigned: masterSigned })
}

