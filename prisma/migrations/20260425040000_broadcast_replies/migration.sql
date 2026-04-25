-- Broadcast replies + recipient tracking + notification types

-- 1) New NotificationType enum values (idempotent)
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'BROADCAST_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'BROADCAST_REPLY';

-- 2) BroadcastRecipient: tracks who got each broadcast + read status per user
CREATE TABLE "BroadcastRecipient" (
    "id" TEXT NOT NULL,
    "broadcastId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "delivered" BOOLEAN NOT NULL DEFAULT true,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BroadcastRecipient_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BroadcastRecipient_broadcastId_userId_key" ON "BroadcastRecipient"("broadcastId", "userId");
CREATE INDEX "BroadcastRecipient_userId_readAt_idx" ON "BroadcastRecipient"("userId", "readAt");

ALTER TABLE "BroadcastRecipient"
  ADD CONSTRAINT "BroadcastRecipient_broadcastId_fkey"
  FOREIGN KEY ("broadcastId") REFERENCES "Broadcast"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BroadcastRecipient"
  ADD CONSTRAINT "BroadcastRecipient_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 3) BroadcastReply: thread of messages (subscriber ↔ admin) per broadcast per subscriber
CREATE TABLE "BroadcastReply" (
    "id" TEXT NOT NULL,
    "broadcastId" TEXT NOT NULL,
    "threadOwnerId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "bodyText" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BroadcastReply_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BroadcastReply_broadcastId_threadOwnerId_idx" ON "BroadcastReply"("broadcastId", "threadOwnerId");

ALTER TABLE "BroadcastReply"
  ADD CONSTRAINT "BroadcastReply_broadcastId_fkey"
  FOREIGN KEY ("broadcastId") REFERENCES "Broadcast"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BroadcastReply"
  ADD CONSTRAINT "BroadcastReply_threadOwnerId_fkey"
  FOREIGN KEY ("threadOwnerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BroadcastReply"
  ADD CONSTRAINT "BroadcastReply_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
