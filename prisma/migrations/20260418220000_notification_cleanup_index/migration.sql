-- Index for efficient notification cleanup cron (delete by createdAt)
CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt");
