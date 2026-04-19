-- Task photos for Crew checklist evidence
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "photos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Backfill emailVerified for existing users so new verification gate
-- does not lock them out of the platform
UPDATE "User"
SET "emailVerified" = COALESCE("emailVerified", "createdAt")
WHERE "emailVerified" IS NULL;
