-- Add new payment method fields to user_settings table
-- This migration adds comprehensive payment method support

-- Add new columns to user_settings table
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS cashapp_id TEXT,
ADD COLUMN IF NOT EXISTS apple_pay_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_account TEXT;

-- Update existing columns to match new structure
-- Rename existing columns to match API expectations
ALTER TABLE public.user_settings 
RENAME COLUMN business_email TO email;

ALTER TABLE public.user_settings 
RENAME COLUMN business_phone TO phone_old;

-- Drop the old phone column if it exists (we'll use the new one)
ALTER TABLE public.user_settings 
DROP COLUMN IF EXISTS phone_old;

-- Add comment to document the new structure
COMMENT ON TABLE public.user_settings IS 'User settings including business information and payment methods';
COMMENT ON COLUMN public.user_settings.phone IS 'Business phone number';
COMMENT ON COLUMN public.user_settings.website IS 'Business website URL';
COMMENT ON COLUMN public.user_settings.cashapp_id IS 'CashApp ID for payments';
COMMENT ON COLUMN public.user_settings.apple_pay_id IS 'Apple Pay ID for payments';
COMMENT ON COLUMN public.user_settings.stripe_account IS 'Stripe account information';
