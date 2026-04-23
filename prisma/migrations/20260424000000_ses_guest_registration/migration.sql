-- SES (Registro de Viajeros) — mandatory guest registration fields for Spain
-- Required by Real Decreto 933/2021 (effective since Dec 2022)
-- Fields: document type, document number, date of birth, gender, address

ALTER TABLE "Reservation"
  ADD COLUMN "guestDocumentType" TEXT,
  ADD COLUMN "guestDocumentNumber" TEXT,
  ADD COLUMN "guestDateOfBirth" DATE,
  ADD COLUMN "guestGender" TEXT,
  ADD COLUMN "guestAddress" TEXT,
  ADD COLUMN "sesSubmittedAt" TIMESTAMP(3),
  ADD COLUMN "sesReference" TEXT;
