-- VAGF pipeline v2: confidence tracking + score disputes

-- Confidence fields
ALTER TABLE "GuestFeedback"
  ADD COLUMN "analysisConfidence" DOUBLE PRECISION,
  ADD COLUMN "analysisCrossValidated" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "analysisReviewRequired" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "analysisReviewedAt" TIMESTAMP(3),
  ADD COLUMN "analysisReviewedBy" TEXT;

-- Score dispute fields
ALTER TABLE "GuestFeedback"
  ADD COLUMN "scoreDisputed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "scoreDisputeReason" TEXT,
  ADD COLUMN "scoreDisputedAt" TIMESTAMP(3),
  ADD COLUMN "scoreDisputeResolvedAt" TIMESTAMP(3),
  ADD COLUMN "scoreDisputeResolvedBy" TEXT,
  ADD COLUMN "scoreDisputeOutcome" TEXT;

-- Index for Captain review queue
CREATE INDEX IF NOT EXISTS "GuestFeedback_analysisReviewRequired_idx" ON "GuestFeedback"("analysisReviewRequired");
