-- AlterTable Lead: add score and bantData columns
ALTER TABLE "Lead" ADD COLUMN "score" INTEGER;
ALTER TABLE "Lead" ADD COLUMN "bantData" JSONB;
