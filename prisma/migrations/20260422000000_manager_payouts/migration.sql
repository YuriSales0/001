-- Manager commission payouts — monthly cycle
--
-- Pays Managers 15% of client subscriptions + 3% of gross rental revenue
-- + portfolio bonus tiers (€150/€400/€750) + one-time acquisition bonus
-- (€50/€100/€150). HostMasters pays by day 10 of the following month.

CREATE TYPE "ManagerPayoutStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'CANCELLED');

-- Add COMMISSION_STATEMENT to NotificationType enum
ALTER TYPE "NotificationType" ADD VALUE 'COMMISSION_STATEMENT';

CREATE TABLE "ManagerPayout" (
  "id"                   TEXT NOT NULL,
  "managerId"            TEXT NOT NULL,
  "periodYear"           INTEGER NOT NULL,
  "periodMonth"          INTEGER NOT NULL,
  "subscriptionEarnings" DECIMAL(10,2) NOT NULL,
  "rentalEarnings"       DECIMAL(10,2) NOT NULL,
  "portfolioBonus"       DECIMAL(10,2) NOT NULL,
  "acquisitionBonus"     DECIMAL(10,2) NOT NULL,
  "finalAmount"          DECIMAL(10,2) NOT NULL,
  "breakdown"            JSONB,
  "clientCount"          INTEGER NOT NULL DEFAULT 0,
  "activePropertyCount"  INTEGER NOT NULL DEFAULT 0,
  "status"               "ManagerPayoutStatus" NOT NULL DEFAULT 'PENDING',
  "payBy"                TIMESTAMP(3) NOT NULL,
  "paidAt"               TIMESTAMP(3),
  "cancelledAt"          TIMESTAMP(3),
  "stripeTransferId"     TEXT,
  "statementSentAt"      TIMESTAMP(3),
  "notes"                TEXT,
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"            TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ManagerPayout_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ManagerPayout_managerId_periodYear_periodMonth_key"
  ON "ManagerPayout"("managerId", "periodYear", "periodMonth");

CREATE INDEX "ManagerPayout_managerId_idx" ON "ManagerPayout"("managerId");
CREATE INDEX "ManagerPayout_status_idx" ON "ManagerPayout"("status");
CREATE INDEX "ManagerPayout_periodYear_periodMonth_idx"
  ON "ManagerPayout"("periodYear", "periodMonth");

ALTER TABLE "ManagerPayout"
  ADD CONSTRAINT "ManagerPayout_managerId_fkey"
  FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
