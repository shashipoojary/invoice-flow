-- Add email_from_address field to user_settings table
-- This allows users to configure their verified email domain from Resend

ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS email_from_address text;

COMMENT ON COLUMN public.user_settings.email_from_address IS 'Verified email address from Resend (e.g., noreply@yourdomain.com). Leave empty to use default onboarding@resend.dev (only works for test emails).';

