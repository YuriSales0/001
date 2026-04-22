-- Property AI Assistant context fields

ALTER TABLE "Property" ADD COLUMN "wifiSsid"             TEXT;
ALTER TABLE "Property" ADD COLUMN "wifiPassword"         TEXT;
ALTER TABLE "Property" ADD COLUMN "doorCode"             TEXT;
ALTER TABLE "Property" ADD COLUMN "smartLockPassword"    TEXT;
ALTER TABLE "Property" ADD COLUMN "emergencyWhatsapp"    TEXT;
ALTER TABLE "Property" ADD COLUMN "parkingInstructions"  TEXT;
ALTER TABLE "Property" ADD COLUMN "checkInInstructions"  TEXT;
ALTER TABLE "Property" ADD COLUMN "checkOutInstructions" TEXT;
ALTER TABLE "Property" ADD COLUMN "appliancesInfo"       TEXT;
ALTER TABLE "Property" ADD COLUMN "breakerLocation"      TEXT;
ALTER TABLE "Property" ADD COLUMN "waterShutoffLocation" TEXT;
ALTER TABLE "Property" ADD COLUMN "propertyQuirks"       TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Property" ADD COLUMN "guestGuideUrl"        TEXT;
