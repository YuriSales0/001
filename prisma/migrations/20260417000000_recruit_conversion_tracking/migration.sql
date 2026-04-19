-- Track conversion from RecruitApplication → User (via invite)
ALTER TABLE "RecruitApplication" ADD COLUMN IF NOT EXISTS "convertedToUserId" TEXT;
ALTER TABLE "RecruitApplication" ADD COLUMN IF NOT EXISTS "convertedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "RecruitApplication_convertedToUserId_idx" ON "RecruitApplication"("convertedToUserId");
