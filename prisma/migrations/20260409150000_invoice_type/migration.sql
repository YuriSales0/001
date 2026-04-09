-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('RENTAL', 'SUBSCRIPTION', 'ADJUSTMENT');

-- AlterTable: add type column defaulting to RENTAL so existing rows are classified correctly
ALTER TABLE "Invoice" ADD COLUMN "type" "InvoiceType" NOT NULL DEFAULT 'RENTAL';
