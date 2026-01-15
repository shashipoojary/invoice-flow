-- Add metadata column to invoices table for premium unlock tracking
-- Run this in your Supabase SQL editor

ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add comment to explain the metadata field
COMMENT ON COLUMN public.invoices.metadata IS 'Stores additional invoice metadata such as premium_unlocked status and premium_unlocked_at timestamp';

