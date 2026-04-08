-- Add clientCode to User for human-readable client IDs (e.g. CLI-0001)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "clientCode" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "User_clientCode_key" ON "User"("clientCode");
