-- Enable reminders for all existing invoices that have reminders disabled
UPDATE invoices 
SET reminder_settings = jsonb_set(
  COALESCE(reminder_settings, '{}'::jsonb),
  '{enabled}',
  'true'::jsonb
)
WHERE reminder_settings->>'enabled' = 'false' OR reminder_settings IS NULL;

-- Also update the default for future invoices
ALTER TABLE invoices ALTER COLUMN reminder_settings SET DEFAULT '{
  "enabled": true,
  "useSystemDefaults": true,
  "customRules": []
}'::jsonb;
