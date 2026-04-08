-- Add invoiceNumber, invoiceType, stripeSessionId to Invoice
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "invoiceNumber" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "invoiceType" TEXT NOT NULL DEFAULT 'SERVICE';
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "stripeSessionId" TEXT;
