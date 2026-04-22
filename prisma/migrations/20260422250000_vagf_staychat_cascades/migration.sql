-- Fix cascade rules for GuestFeedback and GuestStayChat relations
-- Previously: all default (Restrict) → orphans + deletion blocks

-- GuestFeedback
ALTER TABLE "GuestFeedback" DROP CONSTRAINT IF EXISTS "GuestFeedback_reservationId_fkey";
ALTER TABLE "GuestFeedback" ADD CONSTRAINT "GuestFeedback_reservationId_fkey"
  FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GuestFeedback" DROP CONSTRAINT IF EXISTS "GuestFeedback_propertyId_fkey";
ALTER TABLE "GuestFeedback" ADD CONSTRAINT "GuestFeedback_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- clientId kept RESTRICT (we should never delete a User with feedback — audit)
-- crewMemberId SET NULL (crew member can leave, feedback stays but unlinked)
ALTER TABLE "GuestFeedback" DROP CONSTRAINT IF EXISTS "GuestFeedback_crewMemberId_fkey";
ALTER TABLE "GuestFeedback" ADD CONSTRAINT "GuestFeedback_crewMemberId_fkey"
  FOREIGN KEY ("crewMemberId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- GuestStayChat
ALTER TABLE "GuestStayChat" DROP CONSTRAINT IF EXISTS "GuestStayChat_reservationId_fkey";
ALTER TABLE "GuestStayChat" ADD CONSTRAINT "GuestStayChat_reservationId_fkey"
  FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GuestStayChat" DROP CONSTRAINT IF EXISTS "GuestStayChat_propertyId_fkey";
ALTER TABLE "GuestStayChat" ADD CONSTRAINT "GuestStayChat_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GuestStayChat" DROP CONSTRAINT IF EXISTS "GuestStayChat_escalatedToUserId_fkey";
ALTER TABLE "GuestStayChat" ADD CONSTRAINT "GuestStayChat_escalatedToUserId_fkey"
  FOREIGN KEY ("escalatedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
