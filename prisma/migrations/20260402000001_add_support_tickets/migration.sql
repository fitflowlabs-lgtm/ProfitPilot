CREATE TABLE IF NOT EXISTS "SupportTicket" (
  "id"          TEXT NOT NULL,
  "senderEmail" TEXT NOT NULL,
  "senderName"  TEXT,
  "subject"     TEXT,
  "body"        TEXT NOT NULL,
  "aiDraft"     TEXT,
  "status"      TEXT NOT NULL DEFAULT 'open',
  "userId"      TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "SupportTicket"
  ADD CONSTRAINT "SupportTicket_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
