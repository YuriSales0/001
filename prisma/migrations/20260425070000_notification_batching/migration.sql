-- Notification Hub: smart batching support.
-- Adds count column (events coalesced into one row) and updatedAt + an index
-- to make the dedupe lookup (userId, type, link, read, createdAt) cheap.

ALTER TABLE "Notification" ADD COLUMN "count" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Notification" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "Notification_userId_type_link_read_createdAt_idx"
  ON "Notification"("userId", "type", "link", "read", "createdAt");
