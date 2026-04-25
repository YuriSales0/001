-- Performance indexes for 25-100 properties scale
-- Eliminates full-table scans on high-frequency queries

-- Reservation (booking queries, monthly reports, pricing)
CREATE INDEX IF NOT EXISTS "Reservation_propertyId_idx" ON "Reservation"("propertyId");
CREATE INDEX IF NOT EXISTS "Reservation_status_idx" ON "Reservation"("status");
CREATE INDEX IF NOT EXISTS "Reservation_propertyId_status_idx" ON "Reservation"("propertyId", "status");
CREATE INDEX IF NOT EXISTS "Reservation_checkIn_idx" ON "Reservation"("checkIn");

-- Property (owner dashboards, admin listings)
CREATE INDEX IF NOT EXISTS "Property_ownerId_idx" ON "Property"("ownerId");
CREATE INDEX IF NOT EXISTS "Property_status_idx" ON "Property"("status");

-- Task (crew assignment, scheduling, overdue checks)
CREATE INDEX IF NOT EXISTS "Task_propertyId_idx" ON "Task"("propertyId");
CREATE INDEX IF NOT EXISTS "Task_propertyId_status_idx" ON "Task"("propertyId", "status");
CREATE INDEX IF NOT EXISTS "Task_dueDate_idx" ON "Task"("dueDate");

-- Payout (financial reports, scheduled processing)
CREATE INDEX IF NOT EXISTS "Payout_propertyId_idx" ON "Payout"("propertyId");
CREATE INDEX IF NOT EXISTS "Payout_status_idx" ON "Payout"("status");
CREATE INDEX IF NOT EXISTS "Payout_scheduledFor_idx" ON "Payout"("scheduledFor");

-- Lead (CRM pipeline, manager dashboard)
CREATE INDEX IF NOT EXISTS "Lead_assignedManagerId_idx" ON "Lead"("assignedManagerId");
CREATE INDEX IF NOT EXISTS "Lead_status_idx" ON "Lead"("status");

-- MonthlyReport
CREATE INDEX IF NOT EXISTS "MonthlyReport_propertyId_idx" ON "MonthlyReport"("propertyId");
