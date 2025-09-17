-- Add missing business settings fields to user_settings table
-- This migration adds the fields that are used in the settings page

-- Add missing columns to user_settings table
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS logo text,
ADD COLUMN IF NOT EXISTS paypal_email text,
ADD COLUMN IF NOT EXISTS cashapp_id text,
ADD COLUMN IF NOT EXISTS venmo_id text,
ADD COLUMN IF NOT EXISTS google_pay_upi text,
ADD COLUMN IF NOT EXISTS apple_pay_id text,
ADD COLUMN IF NOT EXISTS bank_account text,
ADD COLUMN IF NOT EXISTS bank_ifsc_swift text,
ADD COLUMN IF NOT EXISTS bank_iban text,
ADD COLUMN IF NOT EXISTS stripe_account text,
ADD COLUMN IF NOT EXISTS payment_notes text;

-- Update the existing columns to match the settings page
ALTER TABLE public.user_settings 
ALTER COLUMN business_name DROP NOT NULL,
ALTER COLUMN business_email DROP NOT NULL,
ALTER COLUMN business_phone DROP NOT NULL,
ALTER COLUMN business_address DROP NOT NULL;

-- Add a column for issue_date in invoices table
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS issue_date date DEFAULT CURRENT_DATE;

-- Update the invoice_items table to match the Quick Invoice structure
ALTER TABLE public.invoice_items 
ALTER COLUMN qty DROP NOT NULL,
ALTER COLUMN qty SET DEFAULT 1;

-- Add a column for discount in invoices table
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS discount numeric DEFAULT 0;

-- Create a function to generate invoice numbers per user
CREATE OR REPLACE FUNCTION generate_invoice_number(user_uuid uuid)
RETURNS text AS $$
DECLARE
    last_number integer;
    new_number text;
BEGIN
    -- Get the last invoice number for this user
    SELECT COALESCE(
        MAX(CAST(SUBSTRING(invoice_number FROM 'INV-(\d+)') AS integer)), 
        0
    ) INTO last_number
    FROM public.invoices 
    WHERE user_id = user_uuid;
    
    -- Generate new number
    new_number := 'INV-' || LPAD((last_number + 1)::text, 3, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Create a function to generate secure public tokens
CREATE OR REPLACE FUNCTION generate_public_token()
RETURNS text AS $$
BEGIN
    RETURN encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;
