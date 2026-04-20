-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('CONSUMABLES', 'LAUNDRY', 'RENT', 'UTILITIES', 'SUBSCRIPTIONS', 'VEHICLES', 'MARKETING', 'PROFESSIONAL_SERVICES', 'SALARIES', 'TAXES', 'OTHER');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PAID', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BANK_TRANSFER', 'DIRECT_DEBIT', 'CREDIT_CARD', 'CASH', 'OTHER');

-- CreateEnum
CREATE TYPE "RecurringFrequency" AS ENUM ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL');

-- CreateEnum
CREATE TYPE "ConsumableType" AS ENUM ('LAUNDERABLE', 'DISPOSABLE', 'DURABLE', 'WELCOME_KIT');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('AVAILABLE', 'DEPLOYED', 'IN_TRANSIT', 'WASHING', 'RETURNING', 'QUARANTINE', 'RETIRED');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('CHECKOUT_FROM_STORAGE', 'CHECKIN_TO_PROPERTY', 'PICKUP_FROM_PROPERTY', 'SEND_TO_LAUNDRY', 'RETURN_FROM_LAUNDRY', 'RETURN_TO_STORAGE', 'RETIRED', 'QUARANTINED', 'PURCHASE_ENTRY');

-- DropForeignKey (old Expense -> Reservation)
ALTER TABLE "Expense" DROP CONSTRAINT IF EXISTS "Expense_reservationId_fkey";

-- DropForeignKey (old Expense -> Property)
ALTER TABLE "Expense" DROP CONSTRAINT IF EXISTS "Expense_propertyId_fkey";

-- DropIndex (old Expense indexes if any)
DROP INDEX IF EXISTS "Expense_propertyId_idx";
DROP INDEX IF EXISTS "Expense_reservationId_idx";

-- DropTable (old simple Expense)
DROP TABLE IF EXISTS "Expense";

-- CreateTable: Expense (new comprehensive model)
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "subcategory" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "vatAmount" DECIMAL(10,2),
    "vatRate" DECIMAL(5,2),
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "supplierName" TEXT NOT NULL,
    "supplierTaxId" TEXT,
    "supplierInvoice" TEXT,
    "invoiceUrl" TEXT,
    "invoicePhotoUrl" TEXT,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'DRAFT',
    "paymentMethod" "PaymentMethod",
    "paymentReference" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringFreq" "RecurringFrequency",
    "nextOccurrence" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "propertyId" TEXT,
    "notes" TEXT,
    "autoStockEntry" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ConsumableCategory
CREATE TABLE "ConsumableCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ConsumableType" NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'unit',
    "standardLifecycle" INTEGER,
    "imageUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsumableCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ConsumableItem
CREATE TABLE "ConsumableItem" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "serialNumber" TEXT,
    "batchNumber" TEXT,
    "status" "ItemStatus" NOT NULL DEFAULT 'AVAILABLE',
    "currentPropertyId" TEXT,
    "washCount" INTEGER NOT NULL DEFAULT 0,
    "purchaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purchasePrice" DECIMAL(10,2) NOT NULL,
    "expectedLifespan" INTEGER,
    "retiredAt" TIMESTAMP(3),
    "retireReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsumableItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ConsumableMovement
CREATE TABLE "ConsumableMovement" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "movementType" "MovementType" NOT NULL,
    "fromLocation" TEXT,
    "toLocation" TEXT,
    "propertyId" TEXT,
    "crewMemberId" TEXT,
    "reservationId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "ConsumableMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PropertyConsumableSetup
CREATE TABLE "PropertyConsumableSetup" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "quantityPerStay" INTEGER NOT NULL,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyConsumableSetup_pkey" PRIMARY KEY ("id")
);

-- CreateTable: StockLevel
CREATE TABLE "StockLevel" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "available" INTEGER NOT NULL DEFAULT 0,
    "deployed" INTEGER NOT NULL DEFAULT 0,
    "inLaundry" INTEGER NOT NULL DEFAULT 0,
    "inTransit" INTEGER NOT NULL DEFAULT 0,
    "quarantine" INTEGER NOT NULL DEFAULT 0,
    "retired" INTEGER NOT NULL DEFAULT 0,
    "minimumLevel" INTEGER NOT NULL DEFAULT 0,
    "criticalLevel" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockLevel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Expense
CREATE INDEX "Expense_category_idx" ON "Expense"("category");
CREATE INDEX "Expense_status_idx" ON "Expense"("status");
CREATE INDEX "Expense_expenseDate_idx" ON "Expense"("expenseDate");

-- CreateIndex: ConsumableItem
CREATE UNIQUE INDEX "ConsumableItem_serialNumber_key" ON "ConsumableItem"("serialNumber");
CREATE INDEX "ConsumableItem_categoryId_idx" ON "ConsumableItem"("categoryId");
CREATE INDEX "ConsumableItem_status_idx" ON "ConsumableItem"("status");

-- CreateIndex: ConsumableMovement
CREATE INDEX "ConsumableMovement_itemId_idx" ON "ConsumableMovement"("itemId");
CREATE INDEX "ConsumableMovement_executedAt_idx" ON "ConsumableMovement"("executedAt");

-- CreateIndex: PropertyConsumableSetup
CREATE UNIQUE INDEX "PropertyConsumableSetup_propertyId_categoryId_key" ON "PropertyConsumableSetup"("propertyId", "categoryId");

-- CreateIndex: StockLevel
CREATE UNIQUE INDEX "StockLevel_categoryId_key" ON "StockLevel"("categoryId");

-- AddForeignKey: Expense -> Property
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: ConsumableItem -> ConsumableCategory
ALTER TABLE "ConsumableItem" ADD CONSTRAINT "ConsumableItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ConsumableCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: ConsumableItem -> Property
ALTER TABLE "ConsumableItem" ADD CONSTRAINT "ConsumableItem_currentPropertyId_fkey" FOREIGN KEY ("currentPropertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: ConsumableMovement -> ConsumableItem
ALTER TABLE "ConsumableMovement" ADD CONSTRAINT "ConsumableMovement_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ConsumableItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: ConsumableMovement -> Property
ALTER TABLE "ConsumableMovement" ADD CONSTRAINT "ConsumableMovement_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: PropertyConsumableSetup -> Property
ALTER TABLE "PropertyConsumableSetup" ADD CONSTRAINT "PropertyConsumableSetup_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: PropertyConsumableSetup -> ConsumableCategory
ALTER TABLE "PropertyConsumableSetup" ADD CONSTRAINT "PropertyConsumableSetup_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ConsumableCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: StockLevel -> ConsumableCategory
ALTER TABLE "StockLevel" ADD CONSTRAINT "StockLevel_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ConsumableCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
