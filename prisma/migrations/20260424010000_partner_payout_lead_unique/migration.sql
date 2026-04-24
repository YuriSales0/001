-- Prevent duplicate partner payouts per lead (race condition protection)
-- If a lead is converted twice via retry/double-click, the 2nd insert throws P2002

CREATE UNIQUE INDEX "PartnerPayout_leadId_key" ON "PartnerPayout"("leadId");
