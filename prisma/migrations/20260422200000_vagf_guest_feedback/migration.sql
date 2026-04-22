-- VAGF (Voice Agent Guest Feedback) — database foundation

-- Enums
CREATE TYPE "CallStatus" AS ENUM ('SCHEDULED','IN_PROGRESS','COMPLETED_SUCCESS','COMPLETED_PARTIAL','NOT_ANSWERED','DECLINED','FALLBACK_SMS_SENT','FALLBACK_WEB_COMPLETED','UNREACHABLE','CANCELLED');
CREATE TYPE "NpsCategory" AS ENUM ('PROMOTER','PASSIVE','DETRACTOR');
CREATE TYPE "FeedbackSentiment" AS ENUM ('POSITIVE','NEUTRAL','NEGATIVE','SEVERE_NEGATIVE');
CREATE TYPE "EscalationLevel" AS ENUM ('NONE','LOW','MEDIUM','HIGH','CRITICAL');

-- GuestFeedback
CREATE TABLE "GuestFeedback" (
  "id"                    TEXT NOT NULL,
  "reservationId"         TEXT NOT NULL,
  "propertyId"            TEXT NOT NULL,
  "clientId"              TEXT NOT NULL,
  "crewMemberId"          TEXT,
  "callStatus"            "CallStatus" NOT NULL DEFAULT 'SCHEDULED',
  "callAttempts"          INTEGER NOT NULL DEFAULT 0,
  "callScheduledAt"       TIMESTAMP(3) NOT NULL,
  "callStartedAt"         TIMESTAMP(3),
  "callEndedAt"           TIMESTAMP(3),
  "callDurationSeconds"   INTEGER,
  "language"              TEXT NOT NULL DEFAULT 'en',
  "elevenlabsCallId"      TEXT,
  "twilioCallSid"         TEXT,
  "recordingUrl"          TEXT,
  "transcriptionFull"     TEXT,
  "scorePropertyState"    INTEGER,
  "scoreCleanliness"      INTEGER,
  "scoreCommunication"    INTEGER,
  "scorePlatformOverall"  INTEGER,
  "scoreNps"              INTEGER,
  "npsCategory"           "NpsCategory",
  "sentimentOverall"      "FeedbackSentiment" NOT NULL DEFAULT 'NEUTRAL',
  "feedbackFirstImpression" TEXT,
  "feedbackPositive"      TEXT,
  "feedbackImprovement"   TEXT,
  "feedbackNegative"      TEXT,
  "feedbackRecommendation" TEXT,
  "categoryTags"          TEXT[] DEFAULT ARRAY[]::TEXT[],
  "contactedDuringStay"   BOOLEAN NOT NULL DEFAULT false,
  "contactResponseScore"  INTEGER,
  "reviewPromptSent"      BOOLEAN NOT NULL DEFAULT false,
  "reviewSmsSent"         BOOLEAN NOT NULL DEFAULT false,
  "reviewSmsSentAt"       TIMESTAMP(3),
  "escalationTriggered"   BOOLEAN NOT NULL DEFAULT false,
  "escalationLevel"       "EscalationLevel",
  "escalationNotifiedTo"  TEXT[] DEFAULT ARRAY[]::TEXT[],
  "webToken"              TEXT,
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GuestFeedback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GuestFeedback_reservationId_key" ON "GuestFeedback"("reservationId");
CREATE UNIQUE INDEX "GuestFeedback_webToken_key" ON "GuestFeedback"("webToken");
CREATE INDEX "GuestFeedback_reservationId_idx" ON "GuestFeedback"("reservationId");
CREATE INDEX "GuestFeedback_crewMemberId_idx" ON "GuestFeedback"("crewMemberId");
CREATE INDEX "GuestFeedback_clientId_idx" ON "GuestFeedback"("clientId");
CREATE INDEX "GuestFeedback_propertyId_idx" ON "GuestFeedback"("propertyId");
CREATE INDEX "GuestFeedback_callStatus_idx" ON "GuestFeedback"("callStatus");
CREATE INDEX "GuestFeedback_createdAt_idx" ON "GuestFeedback"("createdAt");

ALTER TABLE "GuestFeedback" ADD CONSTRAINT "GuestFeedback_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GuestFeedback" ADD CONSTRAINT "GuestFeedback_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GuestFeedback" ADD CONSTRAINT "GuestFeedback_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GuestFeedback" ADD CONSTRAINT "GuestFeedback_crewMemberId_fkey" FOREIGN KEY ("crewMemberId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- GuestFeedbackCategory (tag dictionary)
CREATE TABLE "GuestFeedbackCategory" (
  "id"          TEXT NOT NULL,
  "tag"         TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "category"    TEXT NOT NULL,
  "sentiment"   "FeedbackSentiment" NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GuestFeedbackCategory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GuestFeedbackCategory_tag_key" ON "GuestFeedbackCategory"("tag");

-- Add VAGF fields to Reservation
ALTER TABLE "Reservation" ADD COLUMN "feedbackEligible" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Reservation" ADD COLUMN "guestTimezone" TEXT;

-- Add VAGF Crew fields to User
ALTER TABLE "User" ADD COLUMN "guestScoreAverage" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "guestScoreCount" INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "lastGuestScoreAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "suspendedDueToFeedback" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "suspensionReason" TEXT;
ALTER TABLE "User" ADD COLUMN "suspendedAt" TIMESTAMP(3);
