-- CreateEnum
CREATE TYPE "TaxObligationType" AS ENUM ('VUT_LICENSE', 'MODELO_179', 'IRNR_MODELO_210', 'NIE', 'ENERGY_CERTIFICATE', 'FISCAL_REPRESENTATIVE', 'IBI', 'OTHER');

-- CreateEnum
CREATE TYPE "TaxObligationStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'ACTION_REQUIRED', 'COMPLETED', 'EXPIRED', 'NOT_APPLICABLE');

-- CreateTable
CREATE TABLE "TaxObligation" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "propertyId" TEXT,
  "type" "TaxObligationType" NOT NULL,
  "status" "TaxObligationStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "periodLabel" TEXT NOT NULL,
  "dueDate" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "documentUrl" TEXT,
  "notes" TEXT,
  "handledBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TaxObligation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaxObligation_userId_type_idx" ON "TaxObligation"("userId", "type");
CREATE INDEX "TaxObligation_dueDate_idx" ON "TaxObligation"("dueDate");
CREATE INDEX "TaxObligation_status_idx" ON "TaxObligation"("status");

-- AddForeignKey
ALTER TABLE "TaxObligation" ADD CONSTRAINT "TaxObligation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaxObligation" ADD CONSTRAINT "TaxObligation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
