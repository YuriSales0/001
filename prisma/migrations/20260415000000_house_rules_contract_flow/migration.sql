-- Add CONTRACT_PENDING to PropertyStatus enum
ALTER TYPE "PropertyStatus" ADD VALUE 'CONTRACT_PENDING' AFTER 'PENDING_APPROVAL';

-- Add houseRules array to Property
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "houseRules" TEXT[] DEFAULT '{}';

-- Add propertyId to Contract (optional FK)
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "propertyId" TEXT;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Index for looking up contracts by property
CREATE INDEX IF NOT EXISTS "Contract_propertyId_idx" ON "Contract"("propertyId");
