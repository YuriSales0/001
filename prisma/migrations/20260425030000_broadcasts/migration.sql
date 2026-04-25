-- Founder broadcasts: one-way email channel from admin to subscribers.

CREATE TYPE "BroadcastStatus" AS ENUM ('DRAFT', 'SENDING', 'SENT', 'FAILED');
CREATE TYPE "BroadcastAudience" AS ENUM ('ALL_PAID', 'ALL_CLIENTS', 'BY_PLAN', 'BY_LANGUAGE');

CREATE TABLE "Broadcast" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyMarkdown" TEXT NOT NULL,
    "ctaText" TEXT,
    "ctaUrl" TEXT,
    "audienceType" "BroadcastAudience" NOT NULL DEFAULT 'ALL_PAID',
    "audienceValue" TEXT,
    "status" "BroadcastStatus" NOT NULL DEFAULT 'DRAFT',
    "sentAt" TIMESTAMP(3),
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "translations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Broadcast_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Broadcast_senderId_idx" ON "Broadcast"("senderId");
CREATE INDEX "Broadcast_sentAt_idx" ON "Broadcast"("sentAt");

ALTER TABLE "Broadcast"
  ADD CONSTRAINT "Broadcast_senderId_fkey"
  FOREIGN KEY ("senderId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
