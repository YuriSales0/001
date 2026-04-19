-- Group Chats

CREATE TYPE "GroupChatType" AS ENUM ('MANAGERS', 'CREW_OPS', 'CUSTOM');

CREATE TABLE "GroupChat" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "GroupChatType" NOT NULL DEFAULT 'CUSTOM',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GroupChat_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GroupChatMember" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mutedAt" TIMESTAMP(3),
    CONSTRAINT "GroupChatMember_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GroupChatMember_chatId_userId_key" ON "GroupChatMember"("chatId", "userId");
ALTER TABLE "GroupChatMember" ADD CONSTRAINT "GroupChatMember_chatId_fkey"
    FOREIGN KEY ("chatId") REFERENCES "GroupChat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupChatMember" ADD CONSTRAINT "GroupChatMember_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "GroupMessage" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GroupMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "GroupMessage_chatId_createdAt_idx" ON "GroupMessage"("chatId", "createdAt");
ALTER TABLE "GroupMessage" ADD CONSTRAINT "GroupMessage_chatId_fkey"
    FOREIGN KEY ("chatId") REFERENCES "GroupChat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupMessage" ADD CONSTRAINT "GroupMessage_senderId_fkey"
    FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
