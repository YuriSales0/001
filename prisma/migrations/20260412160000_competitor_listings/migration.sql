-- CreateTable
CREATE TABLE "CompetitorListing" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "platform" "Platform" NOT NULL,
    "title" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "zoneId" TEXT,
    "bedrooms" INTEGER NOT NULL DEFAULT 1,
    "bathrooms" INTEGER NOT NULL DEFAULT 1,
    "maxGuests" INTEGER NOT NULL DEFAULT 4,
    "pricePerNight" DOUBLE PRECISION NOT NULL,
    "priceWeekend" DOUBLE PRECISION,
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "isSuperhost" BOOLEAN NOT NULL DEFAULT false,
    "instantBook" BOOLEAN NOT NULL DEFAULT false,
    "minNights" INTEGER NOT NULL DEFAULT 1,
    "amenities" TEXT,
    "imageUrl" TEXT,
    "listingUrl" TEXT,
    "lastScrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetitorListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitorPrice" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "minNights" INTEGER,
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetitorPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompetitorListing_latitude_longitude_idx" ON "CompetitorListing"("latitude", "longitude");
CREATE INDEX "CompetitorListing_zoneId_idx" ON "CompetitorListing"("zoneId");
CREATE UNIQUE INDEX "CompetitorListing_externalId_platform_key" ON "CompetitorListing"("externalId", "platform");

-- CreateIndex
CREATE INDEX "CompetitorPrice_date_idx" ON "CompetitorPrice"("date");
CREATE UNIQUE INDEX "CompetitorPrice_listingId_date_key" ON "CompetitorPrice"("listingId", "date");

-- AddForeignKey
ALTER TABLE "CompetitorPrice" ADD CONSTRAINT "CompetitorPrice_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "CompetitorListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
