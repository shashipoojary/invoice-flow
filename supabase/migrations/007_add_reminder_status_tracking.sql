-- Add reminder status tracking to invoice_reminders table
ALTER TABLE invoice_reminders 
ADD COLUMN IF NOT EXISTS reminder_status VARCHAR(20) DEFAULT 'sent' 
CHECK (reminder_status IN ('sent', 'delivered', 'failed', 'bounced', 'scheduled'));

ALTER TABLE invoice_reminders 
ADD COLUMN IF NOT EXISTS failure_reason TEXT;

-- Create index for reminder status queries
CREATE INDEX IF NOT EXISTS idx_invoice_reminders_status ON invoice_reminders(reminder_status);

-- Create function to update reminder status
CREATE OR REPLACE FUNCTION update_reminder_status(
  reminder_id UUID,
  new_status VARCHAR(20),
  failure_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE invoice_reminders 
  SET 
    reminder_status = new_status,
    failure_reason = failure_reason,
    updated_at = NOW()
  WHERE id = reminder_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_reminder_status(UUID, VARCHAR(20), TEXT) TO authenticated;

-- Create function to get reminder statistics
CREATE OR REPLACE FUNCTION get_reminder_stats(user_uuid UUID)
RETURNS TABLE (
  total_reminders BIGINT,
  sent_reminders BIGINT,
  delivered_reminders BIGINT,
  failed_reminders BIGINT,
  bounced_reminders BIGINT,
  scheduled_reminders BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_reminders,
    COUNT(*) FILTER (WHERE ir.reminder_status = 'sent') as sent_reminders,
    COUNT(*) FILTER (WHERE ir.reminder_status = 'delivered') as delivered_reminders,
    COUNT(*) FILTER (WHERE ir.reminder_status = 'failed') as failed_reminders,
    COUNT(*) FILTER (WHERE ir.reminder_status = 'bounced') as bounced_reminders,
    COUNT(*) FILTER (WHERE ir.reminder_status = 'scheduled') as scheduled_reminders
  FROM invoice_reminders ir
  JOIN invoices i ON ir.invoice_id = i.id
  WHERE i.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_reminder_stats(UUID) TO authenticated;

-- Create view for reminder history with invoice details
CREATE OR REPLACE VIEW reminder_history AS
SELECT 
  ir.id,
  ir.invoice_id,
  ir.reminder_type,
  ir.overdue_days,
  ir.sent_at,
  ir.email_id,
  ir.reminder_status,
  ir.failure_reason,
  ir.created_at,
  ir.updated_at,
  i.invoice_number,
  i.total,
  i.due_date,
  i.status as invoice_status,
  c.name as client_name,
  c.email as client_email,
  c.company as client_company,
  i.user_id
FROM invoice_reminders ir
JOIN invoices i ON ir.invoice_id = i.id
JOIN clients c ON i.client_id = c.id;

-- Grant access to the view
GRANT SELECT ON reminder_history TO authenticated;

-- Create function to schedule reminders based on invoice settings
CREATE OR REPLACE FUNCTION schedule_invoice_reminders(invoice_uuid UUID)
RETURNS VOID AS $$
DECLARE
  invoice_record RECORD;
  reminder_settings JSONB;
  custom_rules JSONB;
  rule JSONB;
  days_until_due INTEGER;
  days_overdue INTEGER;
BEGIN
  -- Get invoice details
  SELECT 
    i.*,
    c.email as client_email,
    c.name as client_name
  INTO invoice_record
  FROM invoices i
  JOIN clients c ON i.client_id = c.id
  WHERE i.id = invoice_uuid;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Parse reminder settings
  reminder_settings := invoice_record.reminder_settings;
  
  IF NOT (reminder_settings->>'enabled')::boolean THEN
    RETURN;
  END IF;
  
  -- Calculate days
  days_until_due := EXTRACT(DAY FROM invoice_record.due_date - NOW())::INTEGER;
  days_overdue := EXTRACT(DAY FROM NOW() - invoice_record.due_date)::INTEGER;
  
  -- Handle system defaults
  IF (reminder_settings->>'useSystemDefaults')::boolean THEN
    -- System defaults: 1 day after due, 7 days after due, 14 days after due
    IF days_overdue >= 1 AND days_overdue <= 2 THEN
      INSERT INTO invoice_reminders (invoice_id, reminder_type, overdue_days, reminder_status)
      VALUES (invoice_uuid, 'friendly', days_overdue, 'scheduled');
    ELSIF days_overdue >= 7 AND days_overdue <= 8 THEN
      INSERT INTO invoice_reminders (invoice_id, reminder_type, overdue_days, reminder_status)
      VALUES (invoice_uuid, 'polite', days_overdue, 'scheduled');
    ELSIF days_overdue >= 14 AND days_overdue <= 15 THEN
      INSERT INTO invoice_reminders (invoice_id, reminder_type, overdue_days, reminder_status)
      VALUES (invoice_uuid, 'firm', days_overdue, 'scheduled');
    END IF;
  ELSE
    -- Handle custom rules
    custom_rules := reminder_settings->'customRules';
    
    FOR rule IN SELECT * FROM jsonb_array_elements(custom_rules)
    LOOP
      IF (rule->>'enabled')::boolean THEN
        IF (rule->>'type') = 'before' AND days_until_due <= (rule->>'days')::INTEGER AND days_until_due > 0 THEN
          INSERT INTO invoice_reminders (invoice_id, reminder_type, overdue_days, reminder_status)
          VALUES (invoice_uuid, COALESCE(rule->>'reminderType', 'friendly'), 0, 'scheduled');
        ELSIF (rule->>'type') = 'after' AND days_overdue >= (rule->>'days')::INTEGER THEN
          INSERT INTO invoice_reminders (invoice_id, reminder_type, overdue_days, reminder_status)
          VALUES (invoice_uuid, COALESCE(rule->>'reminderType', 'friendly'), days_overdue, 'scheduled');
        END IF;
      END IF;
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION schedule_invoice_reminders(UUID) TO authenticated;

-- Create trigger to automatically schedule reminders when invoice is created/updated
CREATE OR REPLACE FUNCTION trigger_schedule_reminders()
RETURNS TRIGGER AS $$
BEGIN
  -- Only schedule reminders for sent invoices with enabled reminder settings
  IF NEW.status = 'sent' AND NEW.reminder_settings IS NOT NULL THEN
    PERFORM schedule_invoice_reminders(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS schedule_reminders_trigger ON invoices;
CREATE TRIGGER schedule_reminders_trigger
  AFTER INSERT OR UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION trigger_schedule_reminders();
