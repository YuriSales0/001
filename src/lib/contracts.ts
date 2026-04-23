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

  return `# HostMasters — Master Service Agreement

**Between:** HostMasters Costa Tropical S.L., Almuñécar, Granada, Spain ("HostMasters")
**And:** ${ownerName ?? '[Owner name to be confirmed]'} ("Owner")
**Plan:** ${PLAN_LABEL[plan]}
**Date:** ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}

---

## 1. Scope

HostMasters Costa Tropical S.L. ("HostMasters") will provide comprehensive short-term rental management services to the Owner for any properties enrolled on the HostMasters platform. This master agreement governs the commercial relationship overall — individual properties are enrolled via the HostMasters dashboard and covered under these same terms.

## 2. Commission & Fees (${PLAN_LABEL[plan]})

| Item | Value |
|---|---|
| Commission on gross rental revenue | ${commissionPct}% |
| Monthly subscription fee | ${monthlyFee === 0 ? '€0 (free tier)' : `€${monthlyFee}/month`} |
| Cleaning per turnover | ${cleaningLine} |

Commission is deducted from gross revenue at each payout. The monthly subscription is billed via Stripe on the subscription anniversary. Plan changes take effect on the next billing cycle and update this schedule automatically — no new agreement needed.

## 3. Services Included (${PLAN_LABEL[plan]})

- Listing creation and management on Airbnb, Booking.com, and direct channels
- 24/7 guest communication via AI-powered Guest Stay Chat
- Check-in/check-out coordination with certified Crew
- Cleaning and turnover to published quality standards (checklist + photo verification)
- Monthly financial statements via the Owner dashboard
${plan === 'BASIC' || plan === 'MID' || plan === 'PREMIUM' ? '- Preventive maintenance visits (monthly inspection)\n- VAGF post-checkout guest feedback analysis\n' : ''}${plan === 'MID' || plan === 'PREMIUM' ? '- AI dynamic pricing (estimated +18–25% revenue uplift)\n- Smart Lock integration with temporary guest codes\n- Priority response: 12h owner / 2h guest\n' : ''}${plan === 'PREMIUM' ? '- Full fiscal compliance: Modelo 179 (quarterly) + IRNR Modelo 210\n- NRU/NRA registration assistance\n- Guest upsells: airport transfers, grocery, laundry\n- Emergency response within 4 hours\n- AI Monitor: daily property health checks\n' : ''}
## 4. Payout Schedule

| Channel | Payout timing |
|---|---|
| Airbnb | Checkout date + 1 day + 2 business days |
| Booking.com | End of month + 5 business days |
| Direct bookings | 7 business days after guest checkout |

Payouts are processed via Stripe Connect to the Owner's linked bank account. A detailed statement is available in the Owner dashboard after each payout.

## 5. Smart Lock Requirement

A compatible Smart Lock must be installed on each enrolled property (Nuki, TTLock, or Yale). HostMasters issues temporary access codes per guest and per Crew task. The Owner has full visibility of entry logs via the dashboard.

## 6. Owner Responsibilities

- Maintain the property in habitable, safe condition
- Hold a valid VUT tourist license (Vivienda de Uso Turístico)
- Maintain a valid energy certificate (Certificado de Eficiencia Energética)
- Obtain NIE and appoint a fiscal representative if non-EU resident
- Register guests with SES (Registro de Viajeros) — HostMasters assists on Premium
- Respond to urgent maintenance requests within 48 hours
- Carry appropriate home insurance with civil liability coverage

## 7. HostMasters Responsibilities

- Maximise occupancy and revenue within the Owner's chosen parameters
- Execute all turnovers to published quality standards (checklist + Crew photo verification + Captain approval)
- Remit net rental revenue per the payout schedule above
- Provide transparent monthly reporting through the Owner dashboard
- Handle all guest communication, complaints, and review management

## 8. Liability & Insurance

HostMasters is not liable for damage caused by guests beyond the platform guarantees (Airbnb AirCover, Booking.com Damage Policy). Claims under these policies are managed by HostMasters on the Owner's behalf. The Owner is responsible for maintaining appropriate home insurance.

## 9. Data Protection

Both parties shall process personal data in accordance with GDPR (EU 2016/679) and Spanish LOPD-GDD (LO 3/2018). Guest data collected for regulatory compliance (SES Registro de Viajeros) is retained for the legally mandated period only. HostMasters will never sell or share Owner data with third parties.

## 10. Confidentiality

All operational data, booking details, financial information, and pricing strategies are strictly confidential. This obligation survives termination.

## 11. Term & Termination

- **Minimum commitment:** none (month-to-month from signing date)
- **Cancellation notice:** 60 days in writing
- The Owner may upgrade or downgrade plans at any time; changes take effect on the next billing cycle
- HostMasters may terminate for: non-payment (after 30-day cure period), fraud, illegal use of the property, or repeated failure to maintain the property in habitable condition

## 12. Governing Law

This agreement is governed by Spanish law. Any disputes shall be submitted to the courts of Granada, Spain.

---

*By signing, the Owner confirms they have read, understood and accept these terms. The compensation schedule above is binding and updates automatically when the Owner changes plan.*

HostMasters Costa Tropical S.L. — Almuñécar, Costa Tropical, Granada, España`
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
