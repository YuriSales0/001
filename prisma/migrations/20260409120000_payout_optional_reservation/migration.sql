-- Make reservationId optional on Payout (allow manual payout creation)
ALTER TABLE "Payout" ALTER COLUMN "reservationId" DROP NOT NULL;

-- Add description field for manual payouts
ALTER TABLE "Payout" ADD COLUMN "description" TEXT;
