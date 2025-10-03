-- Add reminder tracking columns to invoices table
-- Run this in your Supabase SQL Editor

ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0;

ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS last_reminder_sent TIMESTAMP WITH TIME ZONE;

-- Create index for better performance on reminder queries
CREATE INDEX IF NOT EXISTS idx_invoices_reminder_tracking 
ON invoices(status, due_date, reminder_count) 
WHERE status = 'sent';

-- Create index for overdue invoices (without NOW() function)
CREATE INDEX IF NOT EXISTS idx_invoices_overdue 
ON invoices(due_date, status) 
WHERE status = 'sent';
