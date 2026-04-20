-- Partner Portal: Auth fields + PartnerPayout system

-- Add auth fields to Partner
ALTER TABLE "Partner" ADD COLUMN "passwordHash" TEXT;
ALTER TABLE "Partner" ADD COLUMN "loginToken" TEXT;
ALTER TABLE "Partner" ADD COLUMN "lastLoginAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "Partner_loginToken_key" ON "Partner"("loginToken");

-- PartnerPayout status enum
CREATE TYPE "PartnerPayoutStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'REVERSED');

-- PartnerPayout table
CREATE TABLE "PartnerPayout" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "clientName" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "PartnerPayoutStatus" NOT NULL DEFAULT 'PENDING',
    "holdUntil" TIMESTAMP(3) NOT NULL,
    "reversalDeadline" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "reversedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PartnerPayout_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PartnerPayout_partnerId_idx" ON "PartnerPayout"("partnerId");
CREATE INDEX "PartnerPayout_status_idx" ON "PartnerPayout"("status");

ALTER TABLE "PartnerPayout" ADD CONSTRAINT "PartnerPayout_partnerId_fkey"
    FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PartnerPayout" ADD CONSTRAINT "PartnerPayout_leadId_fkey"
    FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
