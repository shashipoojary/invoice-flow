-- Fix reminder sequence logic in schedule_invoice_reminders function
CREATE OR REPLACE FUNCTION schedule_invoice_reminders(invoice_uuid UUID)
RETURNS VOID AS $$
DECLARE
  invoice_record RECORD;
  reminder_settings JSONB;
  custom_rules JSONB;
  rule JSONB;
  days_until_due INTEGER;
  days_overdue INTEGER;
  rule_index INTEGER := 0;
  reminder_types TEXT[] := ARRAY['friendly', 'polite', 'firm', 'urgent'];
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
    -- Handle custom rules with proper sequence
    custom_rules := reminder_settings->'customRules';
    
    FOR rule IN SELECT * FROM jsonb_array_elements(custom_rules)
    LOOP
      IF (rule->>'enabled')::boolean THEN
        -- Determine reminder type based on sequence
        rule_index := rule_index + 1;
        DECLARE
          reminder_type TEXT := reminder_types[LEAST(rule_index, array_length(reminder_types, 1))];
        BEGIN
          IF (rule->>'type') = 'before' AND days_until_due <= (rule->>'days')::INTEGER AND days_until_due > 0 THEN
            INSERT INTO invoice_reminders (invoice_id, reminder_type, overdue_days, reminder_status)
            VALUES (invoice_uuid, reminder_type, 0, 'scheduled');
          ELSIF (rule->>'type') = 'after' AND days_overdue >= (rule->>'days')::INTEGER THEN
            INSERT INTO invoice_reminders (invoice_id, reminder_type, overdue_days, reminder_status)
            VALUES (invoice_uuid, reminder_type, days_overdue, 'scheduled');
          END IF;
        END;
      END IF;
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION schedule_invoice_reminders(UUID) TO authenticated;

