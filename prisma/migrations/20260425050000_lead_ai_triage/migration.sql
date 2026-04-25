-- Lead AI Triage: stores Co-pilot output per lead (priority, opening draft, etc.)

ALTER TABLE "Lead" ADD COLUMN "aiTriage" JSONB;
ALTER TABLE "Lead" ADD COLUMN "aiTriagedAt" TIMESTAMP(3);
