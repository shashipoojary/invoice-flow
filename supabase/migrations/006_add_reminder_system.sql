-- Create invoice_reminders table
CREATE TABLE IF NOT EXISTS invoice_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  reminder_type VARCHAR(20) NOT NULL CHECK (reminder_type IN ('friendly', 'polite', 'firm', 'urgent')),
  overdue_days INTEGER DEFAULT 0,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_invoice_reminders_invoice_id ON invoice_reminders(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_reminders_sent_at ON invoice_reminders(sent_at);
CREATE INDEX IF NOT EXISTS idx_invoice_reminders_type ON invoice_reminders(reminder_type);

-- Add reminder settings to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS reminder_settings JSONB DEFAULT '{
  "enabled": true,
  "useSystemDefaults": true,
  "customRules": []
}'::jsonb;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for invoice_reminders
CREATE TRIGGER update_invoice_reminders_updated_at 
    BEFORE UPDATE ON invoice_reminders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies for invoice_reminders
ALTER TABLE invoice_reminders ENABLE ROW LEVEL SECURITY;

-- Policy for users to see their own invoice reminders
CREATE POLICY "Users can view their own invoice reminders" ON invoice_reminders
  FOR SELECT USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE user_id = auth.uid()
    )
  );

-- Policy for users to insert their own invoice reminders
CREATE POLICY "Users can insert their own invoice reminders" ON invoice_reminders
  FOR INSERT WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices WHERE user_id = auth.uid()
    )
  );

-- Policy for users to update their own invoice reminders
CREATE POLICY "Users can update their own invoice reminders" ON invoice_reminders
  FOR UPDATE USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE user_id = auth.uid()
    )
  );

-- Policy for users to delete their own invoice reminders
CREATE POLICY "Users can delete their own invoice reminders" ON invoice_reminders
  FOR DELETE USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE user_id = auth.uid()
    )
  );

-- Create view for reminder statistics
CREATE OR REPLACE VIEW reminder_stats AS
SELECT 
  i.user_id,
  i.id as invoice_id,
  i.invoice_number,
  i.status,
  i.due_date,
  CASE 
    WHEN i.due_date < NOW() THEN EXTRACT(DAY FROM NOW() - i.due_date)::INTEGER
    ELSE 0
  END as overdue_days,
  COUNT(ir.id) as reminders_sent,
  MAX(ir.sent_at) as last_reminder_sent,
  MAX(ir.reminder_type) as last_reminder_type
FROM invoices i
LEFT JOIN invoice_reminders ir ON i.id = ir.invoice_id
WHERE i.status = 'sent'
GROUP BY i.user_id, i.id, i.invoice_number, i.status, i.due_date;

-- Grant access to the view
GRANT SELECT ON reminder_stats TO authenticated;

-- Create function to get overdue invoices for reminders
CREATE OR REPLACE FUNCTION get_overdue_invoices_for_reminders()
RETURNS TABLE (
  invoice_id UUID,
  user_id UUID,
  invoice_number VARCHAR,
  client_email VARCHAR,
  client_name VARCHAR,
  total_amount DECIMAL,
  due_date TIMESTAMP WITH TIME ZONE,
  overdue_days INTEGER,
  business_name VARCHAR,
  business_email VARCHAR,
  business_phone VARCHAR,
  business_logo TEXT,
  business_tagline VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id as invoice_id,
    i.user_id,
    i.invoice_number,
    c.email as client_email,
    c.name as client_name,
    i.total as total_amount,
    i.due_date,
    EXTRACT(DAY FROM NOW() - i.due_date)::INTEGER as overdue_days,
    bs.business_name,
    bs.email as business_email,
    bs.phone as business_phone,
    bs.logo as business_logo,
    bs.tagline as business_tagline
  FROM invoices i
  JOIN clients c ON i.client_id = c.id
  JOIN business_settings bs ON i.user_id = bs.user_id
  WHERE i.status = 'sent'
    AND i.due_date < NOW()
    AND (i.reminder_settings->>'enabled')::boolean = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_overdue_invoices_for_reminders() TO authenticated;
