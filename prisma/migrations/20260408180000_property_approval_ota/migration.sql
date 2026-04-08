-- Add PENDING_APPROVAL to PropertyStatus enum
ALTER TYPE "PropertyStatus" ADD VALUE 'PENDING_APPROVAL';

-- Add OTA identifier columns
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "airbnbListingId" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "bookingPropertyId" TEXT;

-- Change default for new properties to PENDING_APPROVAL
ALTER TABLE "Property" ALTER COLUMN "status" SET DEFAULT 'PENDING_APPROVAL'::"PropertyStatus";
