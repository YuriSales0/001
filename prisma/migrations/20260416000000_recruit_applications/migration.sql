-- Create RecruitRole and RecruitStatus enums
CREATE TYPE "RecruitRole" AS ENUM ('MANAGER', 'CREW');
CREATE TYPE "RecruitStatus" AS ENUM ('NEW', 'CONTACTED', 'INTERVIEWING', 'ACCEPTED', 'REJECTED');

-- Create RecruitApplication table
CREATE TABLE "RecruitApplication" (
  "id" TEXT NOT NULL,
  "role" "RecruitRole" NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "zone" TEXT,
  "languages" TEXT[] DEFAULT '{}',
  "experience" TEXT,
  "skills" TEXT[] DEFAULT '{}',
  "availability" TEXT,
  "message" TEXT,
  "source" TEXT,
  "locale" TEXT,
  "status" "RecruitStatus" NOT NULL DEFAULT 'NEW',
  "reviewedAt" TIMESTAMP(3),
  "reviewedById" TEXT,
  "adminNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RecruitApplication_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RecruitApplication_role_status_idx" ON "RecruitApplication"("role", "status");
CREATE INDEX "RecruitApplication_createdAt_idx" ON "RecruitApplication"("createdAt");
