-- Two-factor authentication opt-in fields on User
-- v1: EMAIL only. SMS / TOTP reserved for future.
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "twoFactorMethod" TEXT;
