-- Partner Program

CREATE TYPE "PartnerTier" AS ENUM ('STANDARD', 'STANDARD_PLUS', 'PREMIUM', 'STRATEGIC');
CREATE TYPE "PartnerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "businessName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "tier" "PartnerTier" NOT NULL DEFAULT 'STANDARD',
    "referralCode" TEXT NOT NULL,
    "status" "PartnerStatus" NOT NULL DEFAULT 'ACTIVE',
    "commissionFixed" DECIMAL(10,2),
    "commissionPct" DECIMAL(5,2),
    "totalReferrals" INTEGER NOT NULL DEFAULT 0,
    "totalConversions" INTEGER NOT NULL DEFAULT 0,
    "totalCommission" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "zone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Partner_referralCode_key" ON "Partner"("referralCode");

-- Add partnerId to Lead
ALTER TABLE "Lead" ADD COLUMN "partnerId" TEXT;
CREATE INDEX "Lead_partnerId_idx" ON "Lead"("partnerId");
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_partnerId_fkey"
    FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
