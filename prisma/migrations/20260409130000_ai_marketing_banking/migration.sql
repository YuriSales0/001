-- PricingDataPoint
CREATE TABLE "PricingDataPoint" (
  "id"                 TEXT NOT NULL PRIMARY KEY,
  "propertyId"         TEXT NOT NULL,
  "date"               TIMESTAMP(3) NOT NULL,
  "priceCharged"       DOUBLE PRECISION NOT NULL,
  "platform"           TEXT,
  "suggestedPrice"     DOUBLE PRECISION,
  "suggestedSource"    TEXT,
  "acceptedSuggestion" BOOLEAN,
  "leadTimeDays"       INTEGER,
  "stayLength"         INTEGER,
  "dayOfWeek"          INTEGER NOT NULL,
  "monthOfYear"        INTEGER NOT NULL,
  "isWeekend"          BOOLEAN NOT NULL DEFAULT false,
  "isHoliday"          BOOLEAN NOT NULL DEFAULT false,
  "isLocalEvent"       BOOLEAN NOT NULL DEFAULT false,
  "occupancyNearbyPct" DOUBLE PRECISION,
  "reservationId"      TEXT,
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PricingDataPoint_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "PricingDataPoint_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "PricingDataPoint_propertyId_date_idx" ON "PricingDataPoint"("propertyId", "date");
CREATE INDEX "PricingDataPoint_date_idx" ON "PricingDataPoint"("date");

-- Marketing enums
CREATE TYPE "MarketingChannelType" AS ENUM ('GOOGLE_ADS','META','LINKEDIN','EMAIL','SEO','CONTENT','EVENT','PRINT','PARTNERSHIP','SIGNAGE','REFERRAL','OTHER');
CREATE TYPE "CampaignStatus" AS ENUM ('PLANNING','ACTIVE','PAUSED','COMPLETED');
CREATE TYPE "CampaignType" AS ENUM ('DIGITAL','PHYSICAL','EMAIL','EVENT','PRINT');

-- Campaign
CREATE TABLE "Campaign" (
  "id"              TEXT NOT NULL PRIMARY KEY,
  "name"            TEXT NOT NULL,
  "channel"         "MarketingChannelType" NOT NULL,
  "type"            "CampaignType" NOT NULL,
  "status"          "CampaignStatus" NOT NULL DEFAULT 'PLANNING',
  "budgetAllocated" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "budgetSpent"     DOUBLE PRECISION NOT NULL DEFAULT 0,
  "startDate"       TIMESTAMP(3),
  "endDate"         TIMESTAMP(3),
  "targetAudience"  TEXT,
  "description"     TEXT,
  "notes"           TEXT,
  "createdById"     TEXT NOT NULL,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Campaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CampaignSpend
CREATE TABLE "CampaignSpend" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "campaignId"  TEXT NOT NULL,
  "amount"      DOUBLE PRECISION NOT NULL,
  "date"        TIMESTAMP(3) NOT NULL,
  "description" TEXT,
  "receiptUrl"  TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CampaignSpend_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- LeadAttribution
CREATE TABLE "LeadAttribution" (
  "id"           TEXT NOT NULL PRIMARY KEY,
  "leadId"       TEXT NOT NULL,
  "campaignId"   TEXT NOT NULL,
  "attributedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LeadAttribution_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "LeadAttribution_leadId_campaignId_key" UNIQUE ("leadId", "campaignId")
);
