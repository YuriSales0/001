-- ═══════════════════════════════════════════════════════════════════
-- Crew System Foundation
-- Expands task lifecycle, adds Crew scoring, property trust,
-- weekly payouts, and Manager→Captain intervention chain.
-- ═══════════════════════════════════════════════════════════════════

-- ── New enums ──

CREATE TYPE "CrewScoreLevel" AS ENUM ('SUSPENDED', 'BASIC', 'VERIFIED', 'EXPERT', 'ELITE');
CREATE TYPE "CrewPayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED');
CREATE TYPE "InterventionStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED');
CREATE TYPE "AiRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- ── Expand TaskStatus enum ──

ALTER TYPE "TaskStatus" ADD VALUE IF NOT EXISTS 'NOTIFIED';
ALTER TYPE "TaskStatus" ADD VALUE IF NOT EXISTS 'CONFIRMED';
ALTER TYPE "TaskStatus" ADD VALUE IF NOT EXISTS 'SUBMITTED';
ALTER TYPE "TaskStatus" ADD VALUE IF NOT EXISTS 'APPROVED';
ALTER TYPE "TaskStatus" ADD VALUE IF NOT EXISTS 'REJECTED';
ALTER TYPE "TaskStatus" ADD VALUE IF NOT EXISTS 'REDISTRIBUTED';

-- ── User additions ──

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isCaptain" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeConnectId" TEXT;

-- ── Property additions ──

ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "smartLockInstalled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "smartLockProvider" TEXT;

-- ── Task lifecycle fields ──

ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "notifiedAt" TIMESTAMP(3);
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "confirmedAt" TIMESTAMP(3);
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP(3);
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "rejectedAt" TIMESTAMP(3);
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "captainId" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "smartLockCode" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "smartLockExpiresAt" TIMESTAMP(3);
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "amount" DOUBLE PRECISION;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "scoreImpact" INTEGER;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "crewPayoutId" TEXT;

CREATE INDEX IF NOT EXISTS "Task_assigneeId_status_idx" ON "Task"("assigneeId", "status");
CREATE INDEX IF NOT EXISTS "Task_crewPayoutId_idx" ON "Task"("crewPayoutId");

-- ── CrewScore ──

CREATE TABLE IF NOT EXISTS "CrewScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentScore" INTEGER NOT NULL DEFAULT 100,
    "level" "CrewScoreLevel" NOT NULL DEFAULT 'BASIC',
    "totalTasks" INTEGER NOT NULL DEFAULT 0,
    "totalApproved" INTEGER NOT NULL DEFAULT 0,
    "totalRejected" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CrewScore_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CrewScore_userId_key" ON "CrewScore"("userId");
ALTER TABLE "CrewScore" ADD CONSTRAINT "CrewScore_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── CrewScoreEvent ──

CREATE TABLE IF NOT EXISTS "CrewScoreEvent" (
    "id" TEXT NOT NULL,
    "crewScoreId" TEXT NOT NULL,
    "taskId" TEXT,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "scoreBefore" INTEGER NOT NULL,
    "scoreAfter" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CrewScoreEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "CrewScoreEvent_crewScoreId_createdAt_idx" ON "CrewScoreEvent"("crewScoreId", "createdAt");
ALTER TABLE "CrewScoreEvent" ADD CONSTRAINT "CrewScoreEvent_crewScoreId_fkey"
    FOREIGN KEY ("crewScoreId") REFERENCES "CrewScore"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── CrewPropertyRelationship ──

CREATE TABLE IF NOT EXISTS "CrewPropertyRelationship" (
    "id" TEXT NOT NULL,
    "crewId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "totalTasks" INTEGER NOT NULL DEFAULT 0,
    "firstTaskAt" TIMESTAMP(3),
    "lastTaskAt" TIMESTAMP(3),
    "taskTypeBreakdown" JSONB,
    "propertyTrustScore" INTEGER NOT NULL DEFAULT 50,
    "ownerApproved" BOOLEAN NOT NULL DEFAULT false,
    "captainEndorsed" BOOLEAN NOT NULL DEFAULT false,
    "incidentCount" INTEGER NOT NULL DEFAULT 0,
    "aiRiskLevel" "AiRiskLevel" NOT NULL DEFAULT 'LOW',
    "aiAlertActive" BOOLEAN NOT NULL DEFAULT false,
    "aiLastEvaluatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CrewPropertyRelationship_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CrewPropertyRelationship_crewId_propertyId_key" ON "CrewPropertyRelationship"("crewId", "propertyId");
CREATE INDEX IF NOT EXISTS "CrewPropertyRelationship_propertyId_idx" ON "CrewPropertyRelationship"("propertyId");
ALTER TABLE "CrewPropertyRelationship" ADD CONSTRAINT "CrewPropertyRelationship_crewId_fkey"
    FOREIGN KEY ("crewId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrewPropertyRelationship" ADD CONSTRAINT "CrewPropertyRelationship_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── CrewPayout ──

CREATE TABLE IF NOT EXISTS "CrewPayout" (
    "id" TEXT NOT NULL,
    "crewId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "weekEnd" TIMESTAMP(3) NOT NULL,
    "taskCount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bonusAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "finalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "CrewPayoutStatus" NOT NULL DEFAULT 'PENDING',
    "stripeTransferId" TEXT,
    "statementSentAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "failedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CrewPayout_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CrewPayout_crewId_weekStart_key" ON "CrewPayout"("crewId", "weekStart");
CREATE INDEX IF NOT EXISTS "CrewPayout_status_idx" ON "CrewPayout"("status");
ALTER TABLE "CrewPayout" ADD CONSTRAINT "CrewPayout_crewId_fkey"
    FOREIGN KEY ("crewId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Task → CrewPayout FK
ALTER TABLE "Task" ADD CONSTRAINT "Task_crewPayoutId_fkey"
    FOREIGN KEY ("crewPayoutId") REFERENCES "CrewPayout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Task → Captain FK
ALTER TABLE "Task" ADD CONSTRAINT "Task_captainId_fkey"
    FOREIGN KEY ("captainId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── CrewIntervention ──

CREATE TABLE IF NOT EXISTS "CrewIntervention" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "captainId" TEXT,
    "reason" TEXT NOT NULL,
    "status" "InterventionStatus" NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CrewIntervention_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "CrewIntervention_taskId_idx" ON "CrewIntervention"("taskId");
CREATE INDEX IF NOT EXISTS "CrewIntervention_status_idx" ON "CrewIntervention"("status");
ALTER TABLE "CrewIntervention" ADD CONSTRAINT "CrewIntervention_taskId_fkey"
    FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrewIntervention" ADD CONSTRAINT "CrewIntervention_managerId_fkey"
    FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CrewIntervention" ADD CONSTRAINT "CrewIntervention_captainId_fkey"
    FOREIGN KEY ("captainId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
