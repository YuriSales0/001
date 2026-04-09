-- Add isSuperUser flag to User table
ALTER TABLE "User" ADD COLUMN "isSuperUser" BOOLEAN NOT NULL DEFAULT FALSE;

-- Set SuperUser for the admin account
UPDATE "User" SET "isSuperUser" = TRUE WHERE email = 'yurisales968@gmail.com';
