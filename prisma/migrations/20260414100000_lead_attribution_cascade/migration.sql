-- Clean up orphaned attributions first
DELETE FROM "LeadAttribution" WHERE "leadId" NOT IN (SELECT "id" FROM "Lead");

-- Add FK constraint with CASCADE delete
ALTER TABLE "LeadAttribution" ADD CONSTRAINT "LeadAttribution_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
