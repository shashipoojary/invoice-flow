-- Migration: Add snapshot columns to invoices and estimates tables
-- This ensures that sent invoices/estimates preserve business and client details
-- at the time of sending, preventing changes to current settings from affecting
-- already sent invoices, estimates, or their reminders

-- Add snapshot columns to invoices table
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS business_settings_snapshot JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS client_data_snapshot JSONB DEFAULT NULL;

-- Add snapshot columns to estimates table
ALTER TABLE public.estimates 
ADD COLUMN IF NOT EXISTS business_settings_snapshot JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS client_data_snapshot JSONB DEFAULT NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_invoices_business_snapshot 
ON public.invoices(business_settings_snapshot) 
WHERE business_settings_snapshot IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_client_snapshot 
ON public.invoices(client_data_snapshot) 
WHERE client_data_snapshot IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_estimates_business_snapshot 
ON public.estimates(business_settings_snapshot) 
WHERE business_settings_snapshot IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_estimates_client_snapshot 
ON public.estimates(client_data_snapshot) 
WHERE client_data_snapshot IS NOT NULL;

