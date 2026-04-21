-- Stay Reviews (Guest Review scoring system)

CREATE TABLE "StayReview" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "cleaningRating" INTEGER NOT NULL,
    "setupRating" INTEGER NOT NULL,
    "conditionRating" INTEGER NOT NULL,
    "overallRating" DECIMAL(3,2) NOT NULL,
    "guestComments" TEXT,
    "issuesReported" TEXT,
    "crewMemberId" TEXT,
    "scoreApplied" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StayReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StayReview_reservationId_key" ON "StayReview"("reservationId");
CREATE INDEX "StayReview_propertyId_idx" ON "StayReview"("propertyId");
CREATE INDEX "StayReview_crewMemberId_idx" ON "StayReview"("crewMemberId");

ALTER TABLE "StayReview" ADD CONSTRAINT "StayReview_reservationId_fkey"
    FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StayReview" ADD CONSTRAINT "StayReview_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StayReview" ADD CONSTRAINT "StayReview_reviewerId_fkey"
    FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
