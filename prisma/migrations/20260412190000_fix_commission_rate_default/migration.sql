-- Fix default commission rate from 18% to 17% (MID plan = DEFAULT_COMMISSION_RATE)

-- Property: change default
ALTER TABLE "Property" ALTER COLUMN "commissionRate" SET DEFAULT 17.0;

-- Payout: change default
ALTER TABLE "Payout" ALTER COLUMN "commissionRate" SET DEFAULT 17.0;

-- Fix existing properties that still have the wrong 18% default
-- Update properties where owner is on MID plan but property has 18%
UPDATE "Property" SET "commissionRate" = 17.0
WHERE "commissionRate" = 18.0;
