-- Add missing notification types for payout failures and reservation cancellations
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'CREW_PAYOUT_FAILED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'RESERVATION_CANCELLED';
