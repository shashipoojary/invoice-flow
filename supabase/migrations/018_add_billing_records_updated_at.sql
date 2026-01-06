-- Add updated_at column to billing_records table
-- This column is used by the webhook handler to track when records are updated

ALTER TABLE public.billing_records 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_billing_records_updated_at
  BEFORE UPDATE ON public.billing_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

