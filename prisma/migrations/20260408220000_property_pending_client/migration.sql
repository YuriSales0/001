-- Add PENDING_CLIENT status: used when manager creates a property awaiting client confirmation
ALTER TYPE "PropertyStatus" ADD VALUE IF NOT EXISTS 'PENDING_CLIENT';
