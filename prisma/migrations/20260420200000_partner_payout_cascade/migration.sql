-- Fix: PartnerPayout.leadId cascade on delete
ALTER TABLE "PartnerPayout" DROP CONSTRAINT IF EXISTS "PartnerPayout_leadId_fkey";
ALTER TABLE "PartnerPayout" ADD CONSTRAINT "PartnerPayout_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
