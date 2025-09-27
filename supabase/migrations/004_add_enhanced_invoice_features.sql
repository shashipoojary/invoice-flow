-- Add enhanced invoice features columns
-- Run this in your Supabase SQL editor

-- Add new columns to invoices table
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'fast' CHECK (type IN ('fast', 'detailed')),
ADD COLUMN IF NOT EXISTS issue_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS payment_terms JSONB DEFAULT '{"enabled": false, "terms": "Net 30"}',
ADD COLUMN IF NOT EXISTS late_fees JSONB DEFAULT '{"enabled": false, "type": "fixed", "amount": 0, "gracePeriod": 0}',
ADD COLUMN IF NOT EXISTS reminders JSONB DEFAULT '{"enabled": false, "useSystemDefaults": true, "rules": []}',
ADD COLUMN IF NOT EXISTS theme JSONB DEFAULT '{"primaryColor": "#3b82f6", "secondaryColor": "#1e40af", "accentColor": "#60a5fa"}';

-- Create index for the new type column
CREATE INDEX IF NOT EXISTS idx_invoices_type ON public.invoices(type);

-- Update existing invoices to have default values
UPDATE public.invoices 
SET 
  type = 'fast',
  issue_date = COALESCE(issue_date, created_at::date),
  payment_terms = COALESCE(payment_terms, '{"enabled": false, "terms": "Net 30"}'),
  late_fees = COALESCE(late_fees, '{"enabled": false, "type": "fixed", "amount": 0, "gracePeriod": 0}'),
  reminders = COALESCE(reminders, '{"enabled": false, "useSystemDefaults": true, "rules": []}'),
  theme = COALESCE(theme, '{"primaryColor": "#3b82f6", "secondaryColor": "#1e40af", "accentColor": "#60a5fa"}')
WHERE type IS NULL OR issue_date IS NULL OR payment_terms IS NULL OR late_fees IS NULL OR reminders IS NULL OR theme IS NULL;
