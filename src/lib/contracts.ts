import { prisma } from './prisma'
import { PLAN_COMMISSION, PLAN_MONTHLY_FEE, CLEANING_FEE_STANDARD, CLEANING_INCLUDED_MIN_NIGHTS } from './finance'

type PlanTier = 'STARTER' | 'BASIC' | 'MID' | 'PREMIUM'

const PLAN_LABEL: Record<PlanTier, string> = {
  STARTER: 'Starter',
  BASIC:   'Basic',
  MID:     'Mid',
  PREMIUM: 'Premium',
}

/**
 * Generate the terms for a Client master service agreement based on plan.
 * This is the per-client baseline contract — it survives plan changes
 * (the compensation JSON is updated in place on plan change).
 */
export function generateClientMasterTerms(plan: PlanTier, ownerName: string | null): string {
  const commissionPct = Math.round(PLAN_COMMISSION[plan] * 100)
  const monthlyFee = PLAN_MONTHLY_FEE[plan]
  const cleaningFee = CLEANING_FEE_STANDARD[plan]
  const cleaningIncludedMin = CLEANING_INCLUDED_MIN_NIGHTS[plan]
  const cleaningLine = cleaningIncludedMin
    ? `€${cleaningFee} per turnover, included for stays ≥ ${cleaningIncludedMin} nights`
    : `€${cleaningFee} per turnover (always charged)`

  return `# HostMasters Master Service Agreement

**Owner:** ${ownerName ?? '[Owner name to be confirmed]'}
**Plan:** ${PLAN_LABEL[plan]}

## 1. Scope

HostMasters Costa Tropical S.L. ("HostMasters") will provide short-term rental
management services to the Owner for any properties enrolled under this
agreement. A separate property addendum will be issued for each enrolled unit;
this master agreement governs the commercial relationship overall.

## 2. Commission & Fees

- **Commission on gross rental revenue:** ${commissionPct}%
- **Monthly subscription fee:** ${monthlyFee === 0 ? '€0 (free tier)' : `€${monthlyFee}/month`}
- **Cleaning:** ${cleaningLine}

Commission is deducted from gross revenue at payout time. The monthly
subscription is billed via Stripe on the subscription anniversary.

## 3. Services Included (${PLAN_LABEL[plan]})

Full short-term rental management including:
- Listing and channel management (Airbnb, Booking.com, direct)
- 24/7 guest communication and Guest Stay AI assistant
- Check-in / check-out coordination
- Cleaning and turnover operations
- Monthly owner statement and tax-ready reports
${plan === 'BASIC' || plan === 'MID' || plan === 'PREMIUM' ? '- Preventive maintenance visits\n' : ''}${plan === 'MID' || plan === 'PREMIUM' ? '- AI dynamic pricing & Smart Lock integration\n' : ''}${plan === 'PREMIUM' ? '- Full fiscal compliance (Modelo 179 + IRNR Modelo 210)\n- Guest upsells and concierge services\n' : ''}
## 4. Term

This master agreement starts on the date of signing and continues on a
month-to-month basis. Either party may terminate with 60 days written notice.
Plan changes take effect on the next billing cycle and do not require a new
master agreement — commercial terms are tracked via the compensation schedule
attached to this contract.

## 5. Owner Responsibilities

- Maintain the property in good, habitable condition
- Hold all required licenses and fiscal registrations (VUT, energy certificate,
  NIE where applicable)
- Respond to urgent maintenance requests within 48 hours
- Maintain appropriate insurance coverage (civil liability minimum)

## 6. HostMasters Responsibilities

- Operate channel listings and dynamic pricing to maximise occupancy and revenue
- Execute cleaning, maintenance and guest services to published standards
- Remit net rental revenue to the Owner per the agreed payout schedule
- Provide transparent monthly reporting through the Owner dashboard

## 7. Liability & Insurance

HostMasters is not liable for guest-caused damages beyond coverage provided by
the booking platform (Airbnb AirCover, Booking.com Damage Policy). The Owner is
responsible for maintaining an appropriate home insurance policy.

## 8. Data & Confidentiality

Both parties will treat all operational data, bookings, and owner financials as
confidential. HostMasters will process personal data in accordance with GDPR.

---

*By signing, the Owner confirms they have read, understood and agree to these
terms. The attached compensation schedule is binding and updates automatically
on plan changes.*

HostMasters — Costa Tropical, España`
}

/**
 * Build the structured compensation payload stored on the contract.
 * Updated in place on plan changes so there's a single source of truth.
 */
export function buildClientCompensation(plan: PlanTier) {
  return {
    plan,
    commissionRate: PLAN_COMMISSION[plan],
    commissionPct: Math.round(PLAN_COMMISSION[plan] * 100),
    monthlyFeeEUR: PLAN_MONTHLY_FEE[plan],
    cleaningFeeEUR: CLEANING_FEE_STANDARD[plan],
    cleaningIncludedMinNights: CLEANING_INCLUDED_MIN_NIGHTS[plan],
  }
}

/**
 * Ensure a Client has an active master service agreement for their current plan.
 *
 * - If no master contract exists → creates one (DRAFT, unsigned).
 * - If a master contract exists with a different plan → updates the
 *   compensation payload + notes to record the plan change.
 * - Idempotent: safe to call on register, on plan change, or as a repair job.
 *
 * Master contracts are identified by type=CLIENT_SERVICE + propertyId=null.
 * Per-property contracts (with propertyId set) are treated as addenda and
 * untouched by this helper.
 */
export async function ensureClientMasterContract(opts: {
  userId: string
  plan: PlanTier
  ownerName?: string | null
}): Promise<{ id: string; created: boolean; updated: boolean }> {
  const { userId, plan, ownerName } = opts

  const existing = await prisma.contract.findFirst({
    where: {
      userId,
      type: 'CLIENT_SERVICE',
      propertyId: null,
      status: { in: ['DRAFT', 'ACTIVE'] },
    },
    orderBy: { createdAt: 'desc' },
  })

  const compensation = buildClientCompensation(plan)

  if (!existing) {
    const created = await prisma.contract.create({
      data: {
        userId,
        type: 'CLIENT_SERVICE',
        title: `HostMasters Master Service Agreement — ${PLAN_LABEL[plan]}`,
        terms: generateClientMasterTerms(plan, ownerName ?? null),
        compensation,
        startDate: new Date(),
        status: 'DRAFT',
        signedByAdmin: true,
      },
    })
    return { id: created.id, created: true, updated: false }
  }

  const currentPlan = (existing.compensation as { plan?: string } | null)?.plan
  if (currentPlan === plan) {
    return { id: existing.id, created: false, updated: false }
  }

  const changeNote = `Plan changed: ${currentPlan ?? 'unknown'} → ${plan} at ${new Date().toISOString()}`
  const updated = await prisma.contract.update({
    where: { id: existing.id },
    data: {
      compensation,
      terms: generateClientMasterTerms(plan, ownerName ?? null),
      title: `HostMasters Master Service Agreement — ${PLAN_LABEL[plan]}`,
      notes: existing.notes ? `${existing.notes}\n${changeNote}` : changeNote,
    },
  })
  return { id: updated.id, created: false, updated: true }
}

/**
 * Returns true if the user has a signed master service agreement.
 * Used to gate property activation and other plan-dependent actions.
 */
export async function hasSignedMasterContract(userId: string): Promise<boolean> {
  const count = await prisma.contract.count({
    where: {
      userId,
      type: 'CLIENT_SERVICE',
      propertyId: null,
      signedByUser: true,
      status: 'ACTIVE',
    },
  })
  return count > 0
}
