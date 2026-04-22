-- Guest Stay Chat — AI agent + escalation to Manager/Admin

CREATE TYPE "StayChatAuthor" AS ENUM ('GUEST','AI','MANAGER','ADMIN','SYSTEM');
CREATE TYPE "StayChatEscalationStatus" AS ENUM ('NONE','PENDING_MANAGER','PENDING_ADMIN','RESOLVED');

CREATE TABLE "GuestStayChat" (
  "id"                 TEXT NOT NULL,
  "reservationId"      TEXT NOT NULL,
  "propertyId"         TEXT NOT NULL,
  "clientId"           TEXT NOT NULL,
  "token"              TEXT NOT NULL,
  "language"           TEXT NOT NULL DEFAULT 'en',
  "escalationStatus"   "StayChatEscalationStatus" NOT NULL DEFAULT 'NONE',
  "escalatedAt"        TIMESTAMP(3),
  "escalatedToUserId"  TEXT,
  "resolvedAt"         TIMESTAMP(3),
  "messageCount"       INTEGER NOT NULL DEFAULT 0,
  "lastMessageAt"      TIMESTAMP(3),
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GuestStayChat_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GuestStayChat_reservationId_key" ON "GuestStayChat"("reservationId");
CREATE UNIQUE INDEX "GuestStayChat_token_key" ON "GuestStayChat"("token");
CREATE INDEX "GuestStayChat_reservationId_idx" ON "GuestStayChat"("reservationId");
CREATE INDEX "GuestStayChat_propertyId_idx" ON "GuestStayChat"("propertyId");
CREATE INDEX "GuestStayChat_clientId_idx" ON "GuestStayChat"("clientId");
CREATE INDEX "GuestStayChat_escalationStatus_idx" ON "GuestStayChat"("escalationStatus");

ALTER TABLE "GuestStayChat" ADD CONSTRAINT "GuestStayChat_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GuestStayChat" ADD CONSTRAINT "GuestStayChat_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GuestStayChat" ADD CONSTRAINT "GuestStayChat_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GuestStayChat" ADD CONSTRAINT "GuestStayChat_escalatedToUserId_fkey" FOREIGN KEY ("escalatedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "GuestStayMessage" (
  "id"            TEXT NOT NULL,
  "chatId"        TEXT NOT NULL,
  "author"        "StayChatAuthor" NOT NULL,
  "authorUserId"  TEXT,
  "content"       TEXT NOT NULL,
  "aiConfidence"  DOUBLE PRECISION,
  "aiTopicTag"    TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GuestStayMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GuestStayMessage_chatId_idx" ON "GuestStayMessage"("chatId");
CREATE INDEX "GuestStayMessage_createdAt_idx" ON "GuestStayMessage"("createdAt");

ALTER TABLE "GuestStayMessage" ADD CONSTRAINT "GuestStayMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "GuestStayChat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
