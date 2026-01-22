-- Migration: Add write-off columns to invoices table
-- Run this migration to add write-off functionality

ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS write_off_amount NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS write_off_notes TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_invoices_write_off_amount 
ON public.invoices(write_off_amount) 
WHERE write_off_amount > 0;

