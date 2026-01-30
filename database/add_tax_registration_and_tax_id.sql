-- =====================================================
-- TAX REGISTRATION AND TAX ID SUPPORT
-- =====================================================
-- This migration adds:
-- 1. isTaxRegistered boolean field to user_settings
-- 2. tax_id field to user_settings (replaces website field)
-- 3. Safe migration of existing website data (if needed)

-- =====================================================
-- 1. ADD TAX REGISTRATION FIELD
-- =====================================================
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS is_tax_registered BOOLEAN DEFAULT false;

-- Create index for tax registration lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_is_tax_registered ON public.user_settings(is_tax_registered);

-- =====================================================
-- 2. ADD TAX ID FIELD (REPLACES WEBSITE)
-- =====================================================
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS tax_id TEXT;

-- Create index for tax ID lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_tax_id ON public.user_settings(tax_id);

-- =====================================================
-- NOTES
-- =====================================================
-- 1. is_tax_registered: Boolean flag indicating if user is registered to charge tax
-- 2. tax_id: Tax ID / GST Number (replaces website field)
-- 3. Existing users will have is_tax_registered = false by default
-- 4. Existing website data is preserved in the website column (not migrated to tax_id)
--    Users will need to manually enter their Tax ID if they are tax-registered

