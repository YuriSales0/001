-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('AIRBNB', 'BOOKING', 'DIRECT', 'OTHER');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('OPEN', 'CLOSED');

-- AlterEnum
ALTER TYPE "SubscriptionPlan" ADD VALUE 'STARTER';

-- AlterTable: migrate platform String -> Platform enum safely
-- First add the new typed column
ALTER TABLE "Reservation" ADD COLUMN "platform_new" "Platform";
-- Copy existing values where they match the enum
UPDATE "Reservation"
  SET "platform_new" = CASE
    WHEN UPPER("platform") = 'AIRBNB'  THEN 'AIRBNB'::"Platform"
    WHEN UPPER("platform") = 'BOOKING' THEN 'BOOKING'::"Platform"
    WHEN UPPER("platform") = 'DIRECT'  THEN 'DIRECT'::"Platform"
    WHEN UPPER("platform") = 'OTHER'   THEN 'OTHER'::"Platform"
    ELSE NULL
  END
WHERE "platform" IS NOT NULL;
-- Drop old column and rename new one
ALTER TABLE "Reservation" DROP COLUMN "platform";
ALTER TABLE "Reservation" RENAME COLUMN "platform_new" TO "platform";

-- AlterTable: add new Payout fields
ALTER TABLE "Payout" ADD COLUMN "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 18.0,
ADD COLUMN "platform" "Platform";

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "status" "ConversationStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_clientId_managerId_key" ON "Conversation"("clientId", "managerId");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
