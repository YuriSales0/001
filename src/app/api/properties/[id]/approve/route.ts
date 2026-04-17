import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { notify } from '@/lib/notifications'

/**
 * POST /api/properties/[id]/approve
 *
 * Admin approves property → status goes to CONTRACT_PENDING.
 * Property only becomes ACTIVE after the client signs the contract.
 *
 * Flow: PENDING_APPROVAL → (approve) → CONTRACT_PENDING → (sign contract) → ACTIVE
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const property = await prisma.property.findUnique({
    where: { id: params.id },
    select: { id: true, status: true, photos: true, houseRules: true, ownerId: true, name: true },
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

  // Move to CONTRACT_PENDING and auto-generate a service contract
  const [updated, contract] = await prisma.$transaction([
    prisma.property.update({
      where: { id: params.id },
      data: { status: 'CONTRACT_PENDING' },
      select: { id: true, status: true },
    }),
    prisma.contract.create({
      data: {
        userId: property.ownerId,
        propertyId: property.id,
        type: 'CLIENT_SERVICE',
        title: `Service Agreement — ${property.name}`,
        terms: generateContractTerms(property.name),
        startDate: new Date(),
        status: 'DRAFT',
      },
    }),
  ])

  notify({
    userId: property.ownerId,
    type: 'PROPERTY_APPROVED',
    title: `Property approved: ${property.name}`,
    body: 'Your property has been approved. Please sign the service contract to activate it.',
    link: '/client/properties',
  }).catch(() => {})

  return NextResponse.json({ ...updated, contractId: contract.id })
}

/** Generate standard service contract terms */
function generateContractTerms(propertyName: string): string {
  return `# HostMasters Service Agreement

## Property: ${propertyName}

### 1. Services
HostMasters will provide full short-term rental management including:
- Listing and marketing on Airbnb, Booking.com, and direct channels
- Guest communication and support (24/7)
- Check-in/check-out coordination
- Cleaning and maintenance coordination
- Financial reporting and payout processing

### 2. Commission & Fees
As per the selected subscription plan. Commission rates and monthly fees are detailed in your plan page.

### 3. Term
This agreement starts on the date of signing and continues on a month-to-month basis. Either party may terminate with 30 days written notice.

### 4. Owner Responsibilities
- Maintain property in good condition
- Ensure all required licenses are valid (VUT, energy certificate, etc.)
- Respond to urgent maintenance requests within 48h
- Maintain appropriate insurance coverage

### 5. House Rules
The owner-selected house rules will be communicated to all guests and enforced by the HostMasters team.

### 6. Liability
HostMasters is not liable for guest damages beyond what is covered by platform guarantees (Airbnb AirCover, Booking.com Damage Policy).

---
*By signing this agreement, you confirm that you have read, understood, and agree to these terms.*
`
}

