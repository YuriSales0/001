-- Add trackingCode to Campaign for physical/print QR code lead attribution
ALTER TABLE "Campaign" ADD COLUMN "trackingCode" TEXT;
CREATE UNIQUE INDEX "Campaign_trackingCode_key" ON "Campaign"("trackingCode");
