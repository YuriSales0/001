-- M7: relax broadcast-related FKs so user deletion isn't blocked forever.
-- Broadcast.senderId → SET NULL (admin removable; broadcast becomes "orphan
--   founder communication" but stays for history).
-- BroadcastRecipient.userId → CASCADE (subscriber removed = their delivery
--   record removed too; the broadcast itself stays).

-- Make Broadcast.senderId nullable, then re-link FK with SET NULL.
ALTER TABLE "Broadcast" ALTER COLUMN "senderId" DROP NOT NULL;

ALTER TABLE "Broadcast" DROP CONSTRAINT IF EXISTS "Broadcast_senderId_fkey";
ALTER TABLE "Broadcast"
  ADD CONSTRAINT "Broadcast_senderId_fkey"
  FOREIGN KEY ("senderId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- BroadcastRecipient.userId → CASCADE
ALTER TABLE "BroadcastRecipient" DROP CONSTRAINT IF EXISTS "BroadcastRecipient_userId_fkey";
ALTER TABLE "BroadcastRecipient"
  ADD CONSTRAINT "BroadcastRecipient_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
