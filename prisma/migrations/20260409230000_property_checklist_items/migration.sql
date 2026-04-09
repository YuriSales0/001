-- Create PropertyChecklistItem for per-property preventive maintenance configuration
CREATE TABLE "PropertyChecklistItem" (
  "id"         TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "category"   TEXT NOT NULL,
  "label"      TEXT NOT NULL,
  "isActive"   BOOLEAN NOT NULL DEFAULT true,
  "sortOrder"  INTEGER NOT NULL DEFAULT 0,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PropertyChecklistItem_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "PropertyChecklistItem" ADD CONSTRAINT "PropertyChecklistItem_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
