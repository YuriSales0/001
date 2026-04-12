-- AlterTable: Guest demographics on Reservation
ALTER TABLE "Reservation" ADD COLUMN "guestNationality" TEXT;
ALTER TABLE "Reservation" ADD COLUMN "guestCountry" TEXT;
ALTER TABLE "Reservation" ADD COLUMN "guestAge" INTEGER;
ALTER TABLE "Reservation" ADD COLUMN "guestAgeGroup" TEXT;
ALTER TABLE "Reservation" ADD COLUMN "guestGroupSize" INTEGER;
ALTER TABLE "Reservation" ADD COLUMN "hasChildren" BOOLEAN;
ALTER TABLE "Reservation" ADD COLUMN "hasPets" BOOLEAN;
ALTER TABLE "Reservation" ADD COLUMN "isRepeatGuest" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Reservation" ADD COLUMN "guestLanguage" TEXT;
ALTER TABLE "Reservation" ADD COLUMN "bookingLeadDays" INTEGER;
ALTER TABLE "Reservation" ADD COLUMN "bookingChannel" TEXT;

-- CreateTable: MarketReport
CREATE TABLE "MarketReport" (
    "id" TEXT NOT NULL,
    "weekOf" TIMESTAMP(3) NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'costa-tropical',
    "type" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "listingsScraped" INTEGER NOT NULL DEFAULT 0,
    "avgPrice" DOUBLE PRECISION,
    "avgOccupancy" DOUBLE PRECISION,
    "topInsight" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketReport_weekOf_region_type_key" ON "MarketReport"("weekOf", "region", "type");
