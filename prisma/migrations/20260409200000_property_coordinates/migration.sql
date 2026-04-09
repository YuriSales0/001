-- Add geospatial coordinates to Property for future Kepler.gl / deck.gl integration
ALTER TABLE "Property" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "Property" ADD COLUMN "longitude" DOUBLE PRECISION;
