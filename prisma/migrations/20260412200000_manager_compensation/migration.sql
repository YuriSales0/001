-- Manager compensation fields (configurable per manager profile)
ALTER TABLE "User" ADD COLUMN "managerSubscriptionShare" DOUBLE PRECISION;
ALTER TABLE "User" ADD COLUMN "managerCommissionShare" DOUBLE PRECISION;
