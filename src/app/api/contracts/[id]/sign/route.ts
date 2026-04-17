import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { notify } from '@/lib/notifications'

/**
 * POST /api/contracts/[id]/sign
 *
 * Client signs a service contract.
 * If the contract is linked to a property in CONTRACT_PENDING status,
 * the property is activated (→ ACTIVE).
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await requireRole(['ADMIN', 'MANAGER', 'CREW', 'CLIENT'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const me = guard.user!

  const contract = await prisma.contract.findUnique({
    where: { id: params.id },
    include: { property: { select: { id: true, status: true } } },
  })

  if (!contract) return NextResponse.json({ error: 'Contract not found' }, { status: 404 })

  // Only the contract owner can sign
  if (contract.userId !== me.id) {
    return NextResponse.json({ error: 'You can only sign your own contracts' }, { status: 403 })
  }

  // Already signed
  if (contract.signedByUser) {
    return NextResponse.json({ ok: true, alreadySigned: true })
  }

  // Sign the contract + activate property if CONTRACT_PENDING
  const now = new Date()
  const shouldActivate =
    contract.propertyId &&
    contract.property &&
    (contract.property.status as string) === 'CONTRACT_PENDING'

  if (shouldActivate) {
    // Atomic: sign contract + activate property
    const [updatedContract] = await prisma.$transaction([
      prisma.contract.update({
        where: { id: params.id },
        data: { signedByUser: true, signedAt: now, status: 'ACTIVE' },
      }),
      prisma.property.update({
        where: { id: contract.propertyId! },
        data: { status: 'ACTIVE' },
      }),
    ])
    notify({
      userId: me.id,
      type: 'PROPERTY_ACTIVE',
      title: 'Your property is now live!',
      body: 'Contract signed and property activated. Welcome to HostMasters.',
      link: '/client/dashboard',
    }).catch(() => {})

    return NextResponse.json({
      ok: true,
      contractSigned: true,
      propertyActivated: true,
      contractId: updatedContract.id,
    })
  }

  // Just sign without property activation
  const updated = await prisma.contract.update({
    where: { id: params.id },
    data: { signedByUser: true, signedAt: now, status: 'ACTIVE' },
  })

  notify({
    userId: me.id,
    type: 'CONTRACT_READY',
    title: 'Contract signed',
    body: 'Your service agreement has been signed successfully.',
    link: '/client/properties',
  }).catch(() => {})

  return NextResponse.json({ ok: true, contractSigned: true, contractId: updated.id })
}
