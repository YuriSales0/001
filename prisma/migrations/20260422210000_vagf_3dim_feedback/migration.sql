-- VAGF 3-dimension feedback: Property / Crew / Platform accountability split

-- Property dimension scores
ALTER TABLE "GuestFeedback" ADD COLUMN "scorePropertyStructure" INTEGER;
ALTER TABLE "GuestFeedback" ADD COLUMN "scorePropertyAmenities" INTEGER;
ALTER TABLE "GuestFeedback" ADD COLUMN "scoreLocation" INTEGER;
ALTER TABLE "GuestFeedback" ADD COLUMN "scoreValueForMoney" INTEGER;

-- Crew dimension additional score
ALTER TABLE "GuestFeedback" ADD COLUMN "scoreCrewPresentation" INTEGER;

-- Platform dimension additional scores
ALTER TABLE "GuestFeedback" ADD COLUMN "scoreCheckInExperience" INTEGER;
ALTER TABLE "GuestFeedback" ADD COLUMN "scoreCheckOutExperience" INTEGER;

-- Dimension-specific qualitative captures
ALTER TABLE "GuestFeedback" ADD COLUMN "feedbackProperty" TEXT;
ALTER TABLE "GuestFeedback" ADD COLUMN "feedbackPropertyPositive" TEXT;
ALTER TABLE "GuestFeedback" ADD COLUMN "feedbackPropertyImprovement" TEXT;
ALTER TABLE "GuestFeedback" ADD COLUMN "feedbackCrew" TEXT;
ALTER TABLE "GuestFeedback" ADD COLUMN "feedbackCrewPositive" TEXT;
ALTER TABLE "GuestFeedback" ADD COLUMN "feedbackCrewImprovement" TEXT;
ALTER TABLE "GuestFeedback" ADD COLUMN "feedbackPlatform" TEXT;
ALTER TABLE "GuestFeedback" ADD COLUMN "feedbackPlatformPositive" TEXT;
ALTER TABLE "GuestFeedback" ADD COLUMN "feedbackPlatformImprovement" TEXT;
