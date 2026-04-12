-- Crew compensation fields
ALTER TABLE "User" ADD COLUMN "crewContractType" TEXT;
ALTER TABLE "User" ADD COLUMN "crewMonthlyRate" DOUBLE PRECISION;
ALTER TABLE "User" ADD COLUMN "crewTaskRate" DOUBLE PRECISION;
ALTER TABLE "User" ADD COLUMN "crewHourlyRate" DOUBLE PRECISION;
ALTER TABLE "User" ADD COLUMN "crewSkills" TEXT;
ALTER TABLE "User" ADD COLUMN "crewAvailability" TEXT;

-- Onboarding
ALTER TABLE "User" ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "onboardingData" JSONB;

-- Contracts
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "terms" TEXT NOT NULL,
    "compensation" JSONB,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "signedAt" TIMESTAMP(3),
    "signedByUser" BOOLEAN NOT NULL DEFAULT false,
    "signedByAdmin" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Contract" ADD CONSTRAINT "Contract_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
