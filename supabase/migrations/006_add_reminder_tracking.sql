-- Add reminder tracking columns to invoices table
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_reminder_sent TIMESTAMP WITH TIME ZONE;

-- Add reminder settings to user_settings
-- This will be stored as JSON in the existing user_settings column
-- Example structure:
-- {
--   "reminders": {
--     "enabled": true,
--     "frequency": "weekly",
--     "maxReminders": 3,
--     "templates": {
--       "first": "Your invoice is now overdue. Please make payment as soon as possible.",
--       "second": "This is a second reminder for your overdue invoice.",
--       "final": "This is a final notice for your overdue invoice."
--     }
--   }
-- }

-- Create index for better performance on reminder queries
CREATE INDEX IF NOT EXISTS idx_invoices_reminder_tracking 
ON invoices(status, due_date, reminder_count) 
WHERE status = 'sent';

-- Create index for overdue invoices
CREATE INDEX IF NOT EXISTS idx_invoices_overdue 
ON invoices(due_date, status) 
WHERE status = 'sent' AND due_date < NOW();
