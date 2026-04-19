-- Add indexes on frequently queried foreign keys to prevent slow queries at scale

-- User.managerId: filtered in /api/invoices, /api/properties, /api/tax-obligations
CREATE INDEX IF NOT EXISTS "User_managerId_idx" ON "User"("managerId");

-- Property.ownerId: filtered in /api/reports, /api/calendar, /api/reservations
CREATE INDEX IF NOT EXISTS "Property_ownerId_idx" ON "Property"("ownerId");

-- Invoice.clientId: filtered in multiple invoice endpoints
CREATE INDEX IF NOT EXISTS "Invoice_clientId_idx" ON "Invoice"("clientId");

-- Conversation compound filter (clientId, managerId)
CREATE INDEX IF NOT EXISTS "Conversation_clientId_managerId_idx" ON "Conversation"("clientId", "managerId");

-- Payout.reservationId: for joining payouts to reservations
CREATE INDEX IF NOT EXISTS "Payout_reservationId_idx" ON "Payout"("reservationId");

-- Reservation.propertyId: property-scoped reservation queries
CREATE INDEX IF NOT EXISTS "Reservation_propertyId_idx" ON "Reservation"("propertyId");

-- Task.assignedToId: crew task list
CREATE INDEX IF NOT EXISTS "Task_assignedToId_idx" ON "Task"("assignedToId");
