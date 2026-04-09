-- Add pricing intelligence fields to PricingDataPoint
-- Captures PriceLabs range, competitor benchmark, and actual revenue outcome

ALTER TABLE "PricingDataPoint"
  ADD COLUMN "suggestedPriceMin"  DOUBLE PRECISION,
  ADD COLUMN "suggestedPriceMax"  DOUBLE PRECISION,
  ADD COLUMN "competitorAvgPrice" DOUBLE PRECISION,
  ADD COLUMN "revenueResult"      DOUBLE PRECISION;
