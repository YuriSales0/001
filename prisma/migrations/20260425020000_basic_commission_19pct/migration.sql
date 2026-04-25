-- Basic plan commission realignment: 20% → 19%
-- Source of truth is src/lib/finance.ts (PLAN_COMMISSION.BASIC = 0.19).
-- This migration updates stored snapshots to match. Paid/cancelled payouts are
-- left untouched (historical record).

-- 1) Property.commissionRate: 20.0 → 19.0 for owners on BASIC plan.
UPDATE "Property" p
SET "commissionRate" = 19.0
FROM "User" u
WHERE p."ownerId" = u.id
  AND u."subscriptionPlan" = 'BASIC'
  AND p."commissionRate" = 20.0;

-- 2) Payout (SCHEDULED only): recompute commission + netAmount at 19%.
UPDATE "Payout" pay
SET "commissionRate" = 19.0,
    "commission"     = ROUND(CAST(pay."grossAmount" * 0.19 AS numeric), 2),
    "netAmount"      = pay."grossAmount" - ROUND(CAST(pay."grossAmount" * 0.19 AS numeric), 2)
FROM "Property" p, "User" u
WHERE pay."propertyId" = p.id
  AND p."ownerId" = u.id
  AND u."subscriptionPlan" = 'BASIC'
  AND pay."status" = 'SCHEDULED'
  AND pay."commissionRate" = 20.0;
