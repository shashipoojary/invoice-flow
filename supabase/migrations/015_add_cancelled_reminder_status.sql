-- Add 'cancelled' as a valid reminder_status value
-- This allows reminders to be marked as cancelled (e.g., when invoice is paid) instead of failed

-- First, drop the existing check constraint
ALTER TABLE public.invoice_reminders 
DROP CONSTRAINT IF EXISTS invoice_reminders_reminder_status_check;

-- Add the new check constraint with 'cancelled' included
ALTER TABLE public.invoice_reminders 
ADD CONSTRAINT invoice_reminders_reminder_status_check 
CHECK (reminder_status IN ('sent', 'delivered', 'failed', 'bounced', 'scheduled', 'cancelled'));

-- Update existing reminders that failed due to invoice being paid to 'cancelled'
UPDATE public.invoice_reminders
SET reminder_status = 'cancelled'
WHERE reminder_status = 'failed' 
  AND (
    failure_reason LIKE '%Invoice already paid%' 
    OR failure_reason LIKE '%Invoice fully paid%'
    OR failure_reason LIKE '%reminders cancelled%'
  );

-- Add comment
COMMENT ON COLUMN public.invoice_reminders.reminder_status IS 'Status: sent, delivered, failed, bounced, scheduled, or cancelled (when invoice is paid)';

