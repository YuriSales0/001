-- AI Monitoring: SystemAlert model for persisting detected anomalies
-- Future: Claude API will analyse these and generate natural language explanations

CREATE TYPE "AlertSeverity" AS ENUM ('HIGH', 'MEDIUM', 'LOW', 'INFO');

CREATE TABLE "SystemAlert" (
    "id"         TEXT NOT NULL,
    "checkType"  TEXT NOT NULL,
    "severity"   "AlertSeverity" NOT NULL DEFAULT 'MEDIUM',
    "entityId"   TEXT,
    "entityType" TEXT,
    "message"    TEXT NOT NULL,
    "details"    JSONB,
    "resolvedAt" TIMESTAMP(3),
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemAlert_pkey" PRIMARY KEY ("id")
);
