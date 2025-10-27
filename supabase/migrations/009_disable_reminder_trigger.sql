-- Disable the automatic reminder trigger to prevent conflicts with API routes
DROP TRIGGER IF EXISTS schedule_reminders_trigger ON invoices;

