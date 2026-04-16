-- Add CRITICAL severity level
ALTER TYPE "AlertSeverity" ADD VALUE 'CRITICAL' BEFORE 'HIGH';

-- Add new columns for AI analysis, auto-fix, notification tracking
ALTER TABLE "SystemAlert" ADD COLUMN IF NOT EXISTS "aiAnalysis" TEXT;
ALTER TABLE "SystemAlert" ADD COLUMN IF NOT EXISTS "autoFixedAt" TIMESTAMP(3);
ALTER TABLE "SystemAlert" ADD COLUMN IF NOT EXISTS "autoFixNotes" TEXT;
ALTER TABLE "SystemAlert" ADD COLUMN IF NOT EXISTS "notifiedAt" TIMESTAMP(3);
ALTER TABLE "SystemAlert" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "SystemAlert_severity_resolvedAt_idx" ON "SystemAlert"("severity", "resolvedAt");
CREATE INDEX IF NOT EXISTS "SystemAlert_checkType_resolvedAt_idx" ON "SystemAlert"("checkType", "resolvedAt");
