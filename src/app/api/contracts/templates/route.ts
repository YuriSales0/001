import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/session'

const TEMPLATES: Record<string, { title: string; terms: string }> = {
  MANAGER_AGREEMENT: {
    title: 'Manager Service Agreement',
    terms: `# MANAGER SERVICE AGREEMENT

**Between:** HostMasters Costa Tropical S.L., CIF B-XXXXXXXX, Almuñécar, Granada, Spain ("HostMasters")
**And:** [Manager full name], NIF/NIE [number] ("Manager")

---

## 1. PURPOSE

The Manager agrees to serve as an independent Customer Success representative for HostMasters, responsible for acquiring and managing a portfolio of property-owner clients in the assigned territory.

## 2. TERRITORY

The Manager is granted exclusive territory rights within the following zone(s): [Zone name(s)].
Exclusivity applies only while minimum performance thresholds are met (see §8).

## 3. RESPONSIBILITIES

The Manager shall:
- Identify and approach property owners who may benefit from short-term rental management
- Conduct initial discovery calls and property assessments
- Onboard new clients through the HostMasters platform
- Serve as the primary relationship contact for their client portfolio
- Communicate client needs to the HostMasters operations team via the platform — never directly to Crew members

The Manager shall NOT:
- Contact, instruct or manage Crew members directly
- Negotiate pricing, commissions or contractual terms independently
- Represent themselves as an employee of HostMasters

## 4. COMPENSATION

### 4.1 Recurring commission
- **15% of subscription fees** actually collected each month from the Manager's clients
- **3% of gross rental revenue** from the Manager's clients' properties each month
- Starter-plan clients (€0 subscription) generate no subscription commission for the Manager

### 4.2 Portfolio bonus (monthly, cumulative — largest tier applies)
| Active Basic+ properties | Monthly bonus |
|---|---|
| 10+ | +€150 |
| 20+ | +€400 |
| 30+ | +€750 |

### 4.3 Acquisition bonus (one-time, paid in the 2nd month after client activation)
| Client plan | Bonus |
|---|---|
| Basic | €50 |
| Mid | €100 |
| Premium | €150 |

### 4.4 Payment cycle
HostMasters calculates compensation on the 5th of each month for the previous month's activity and pays the Manager by the 10th via bank transfer or Stripe Connect.

## 5. INDEPENDENT CONTRACTOR

The Manager operates as an independent contractor (autónomo) registered in Spain. HostMasters does not provide employment, social security, or tax withholding. The Manager is responsible for their own fiscal obligations including IVA, IRPF, and Social Security contributions.

## 6. CONFIDENTIALITY

The Manager shall not disclose to any third party, during or after this agreement, any client data, financial information, operational procedures, pricing strategies, or proprietary systems belonging to HostMasters.

## 7. NON-COMPETE

During the term and for 12 months after termination, the Manager shall not directly or indirectly solicit any HostMasters client to move their property management to a competing service.

## 8. PERFORMANCE

Minimum: 1 new client onboarded within the first 90 days, and at least 1 per quarter thereafter. Failure to meet minimums may result in territory reassignment after written notice.

## 9. TERM & TERMINATION

- **Minimum term:** 6 months from signing date
- **After minimum:** month-to-month, terminable by either party with 30 days written notice
- Immediate termination for cause: fraud, breach of confidentiality, client abuse, illegal activity

## 10. GOVERNING LAW

This agreement is governed by Spanish law. Disputes shall be resolved in the courts of Granada, Spain.

---

*By signing, both parties confirm they have read, understood, and agree to these terms.*

HostMasters Costa Tropical S.L. — Costa Tropical, Granada, España`,
  },

  CREW_MONTHLY: {
    title: 'Crew Service Agreement (Monthly)',
    terms: `# CREW SERVICE AGREEMENT — MONTHLY CONTRACT

**Between:** HostMasters Costa Tropical S.L. ("HostMasters")
**And:** [Crew member full name], NIF/NIE [number] ("Crew Member")

---

## 1. PURPOSE

The Crew Member agrees to provide operational services (cleaning, turnover, check-in/out, inspections, maintenance tasks) for properties managed by HostMasters, under a fixed monthly compensation structure.

## 2. SERVICES

Tasks are assigned via the HostMasters platform. The Crew Member shall:
- Accept or decline assigned tasks within 30 minutes of notification
- Execute tasks according to the provided checklist and quality standards
- Submit mandatory photo documentation upon task completion
- Maintain the assigned Smart Lock code confidential and use it only during the task window
- Report any property damage or safety concern immediately via the platform

**No photo submission = no task approval = no payment.**

## 3. COMPENSATION

- **Fixed monthly rate:** €[X]/month
- Paid via Stripe Connect every Wednesday for the previous week's approved tasks
- A digital statement is sent via email after each weekly payout
- Score-based bonuses apply per the Crew Score system (see §5)

## 4. SCHEDULE & AVAILABILITY

- The Crew Member commits to a minimum of [X] hours/week availability
- Peak availability (Fridays and Saturdays) is expected and rewarded with +5 score points per shift
- Non-acceptance without justification incurs a -20 score penalty

## 5. CREW SCORE (0–500+)

Performance is tracked via the HostMasters Crew Score:

| Level | Score | Bonus |
|---|---|---|
| Suspended | 0–49 | No task assignment |
| Basic | 50–149 | Standard rate |
| Verified | 150–299 | +5% |
| Expert | 300–499 | +10% |
| Elite | 500+ | +15% + independent inspections |

Falling below 50 results in automatic suspension. Reinstatement requires Captain approval and retraining.

## 6. INDEPENDENT CONTRACTOR

The Crew Member is an independent contractor (autónomo), not an employee of HostMasters. This agreement complies with Spain's Ley Rider (RDL 9/2021): the Crew Member retains full autonomy in how they execute tasks, using their own tools and materials unless provided by the property owner. HostMasters does not impose shift schedules, uniforms, or exclusivity.

## 7. SMART LOCK & PROPERTY ACCESS

- Temporary Smart Lock codes are issued per task and expire after the task window
- The Crew Member must never share access codes with unauthorized persons
- Entry logs are visible to the property owner via the HostMasters dashboard

## 8. CONFIDENTIALITY

All property access codes, owner data, guest information, and operational details are strictly confidential.

## 9. TERM

- Monthly, automatically renewed
- Terminable by either party with 15 days written notice
- Immediate termination for: safety violations, theft, property damage, sharing access codes

## 10. GOVERNING LAW

Governed by Spanish law. Disputes resolved in Granada courts.

---

*By signing, both parties confirm agreement to these terms.*

HostMasters Costa Tropical S.L. — Costa Tropical, Granada, España`,
  },

  CREW_FREELANCER: {
    title: 'Crew Service Agreement (Freelancer)',
    terms: `# CREW SERVICE AGREEMENT — FREELANCER (PER-TASK)

**Between:** HostMasters Costa Tropical S.L. ("HostMasters")
**And:** [Crew member full name], NIF/NIE [number] ("Crew Member")

---

## 1. PURPOSE

The Crew Member agrees to provide operational services on a per-task basis, without exclusivity or minimum commitment.

## 2. TASK FLOW

1. HostMasters platform notifies the Crew Member of available tasks based on their score and location
2. Crew Member has **30 minutes** to accept or decline
3. If not accepted within 30 minutes, the task is redirected and a -20 score penalty applies
4. Upon acceptance, a Smart Lock code (valid only for the task window) is issued
5. Crew Member executes task, submits mandatory photos via the app
6. Crew Captain (or auto-approval for Elite members) reviews and approves

## 3. COMPENSATION

- **Per-task rate:** €[X] per task (varies by task type and property)
- **Per-hour rate:** €[X]/hour (when applicable, e.g., maintenance tasks)
- Score bonus tiers: Verified +5%, Expert +10%, Elite +15%
- Paid weekly via Stripe Connect (every Wednesday for previous week's approved work)

## 4. NO EXCLUSIVITY

The Crew Member is free to provide services to other companies. HostMasters does not require exclusivity, set shifts, or mandate a minimum number of tasks.

## 5. CREW SCORE, SMART LOCK, CONFIDENTIALITY

Same terms as the Monthly Crew Agreement (§5, §7, §8).

## 6. INDEPENDENT CONTRACTOR

Same terms as Monthly Crew Agreement (§6), in compliance with Ley Rider.

## 7. TERM

- Indefinite, per-task basis
- Either party may cease the relationship at any time with no notice period
- Immediate termination for cause (same as Monthly agreement §9)

---

*By signing, both parties confirm agreement to these terms.*

HostMasters Costa Tropical S.L. — Costa Tropical, Granada, España`,
  },

  CLIENT_SERVICE: {
    title: 'Property Management Agreement (Owner)',
    terms: `# PROPERTY MANAGEMENT AGREEMENT

**Between:** HostMasters Costa Tropical S.L. ("HostMasters")
**And:** [Property Owner full name] ("Owner")

---

## 1. SCOPE

HostMasters will provide comprehensive short-term rental management for the Owner's property/ies enrolled under this agreement, including:
- Listing creation and channel management (Airbnb, Booking.com, direct channels)
- Dynamic pricing via AI algorithms (Mid and Premium plans)
- 24/7 guest communication via AI-powered Guest Stay Chat
- Check-in/check-out coordination with certified Crew
- Cleaning, turnover and preventive maintenance
- Monthly financial statements and fiscal-ready reports
- Owner dashboard with full transparency (bookings, revenue, tasks, care)

## 2. COMMISSION & FEES

| | Starter | Basic | Mid | Premium |
|---|---|---|---|---|
| Monthly fee | €0 | €89 | €159 | €269 |
| Commission | 22% | 19% | 17% | 13% |
| Cleaning | €70/turn | €60/turn | €45 (incl. ≥4n) | €35 (incl. ≥3n) |

Commission is calculated on gross rental revenue and deducted at payout. Monthly subscription is billed via Stripe.

## 3. PAYOUT SCHEDULE

- **Airbnb:** checkout date + 1 day + 2 business days
- **Booking.com:** end of month + 5 business days
- **Direct bookings:** 7 business days after guest checkout
- Payouts are processed via Stripe Connect to the Owner's linked bank account

## 4. AI PRICING (Mid & Premium only)

HostMasters uses machine-learning pricing to optimise nightly rates based on demand, seasonality, local events, and competitor analysis. Estimated uplift: +18% (Mid), +25% (Premium) vs static pricing.

## 5. SMART LOCK (required)

A compatible Smart Lock must be installed on the property. HostMasters issues temporary access codes per guest/task. The Owner has full visibility of entry logs via the dashboard.

## 6. OWNER RESPONSIBILITIES

- Maintain property in habitable, safe condition
- Hold valid VUT tourist license (Vivienda de Uso Turístico)
- Maintain a valid energy certificate (Certificado de Eficiencia Energética)
- Obtain NIE (non-EU owners) and appoint a fiscal representative if required
- Respond to urgent maintenance requests within 48 hours
- Carry appropriate home insurance (civil liability minimum)

## 7. HOSTMASTERS RESPONSIBILITIES

- Maximise occupancy and revenue within the Owner's chosen parameters
- Execute all turnovers to published quality standards (checklist + photo verification)
- Remit net rental revenue per the payout schedule
- File Modelo 179 and IRNR Modelo 210 on behalf of the Owner (Premium only)
- Provide transparent monthly statements via the Owner dashboard

## 8. GUEST DAMAGE & INSURANCE

HostMasters is not liable for damage caused by guests beyond platform guarantees (Airbnb AirCover, Booking.com Damage Policy). Claims are managed by HostMasters on the Owner's behalf.

## 9. DATA PROTECTION

Both parties shall process personal data in accordance with GDPR (EU 2016/679) and Spanish LOPD-GDD. Guest data is retained only as required by law (Registro de Viajeros / SES).

## 10. TERM & TERMINATION

- **Minimum commitment:** none (month-to-month)
- **Cancellation notice:** 60 days in advance, in writing
- The Owner may downgrade or upgrade their plan at any time; changes take effect on the next billing cycle
- HostMasters may terminate for non-payment (after 30-day cure period), fraud, or illegal property use

## 11. GOVERNING LAW

This agreement is governed by Spanish law. Any disputes shall be submitted to the courts of Granada, Spain.

---

*By signing, the Owner confirms they have read, understood and accept these terms.*

HostMasters Costa Tropical S.L. — Almuñécar, Costa Tropical, Granada, España`,
  },
}

export async function GET() {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  return NextResponse.json(TEMPLATES)
}
