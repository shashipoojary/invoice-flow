-- Add columns to users table for storing Dodo Payment customer and payment method info
-- This enables automatic charging for Pay Per Invoice plan

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS dodo_customer_id text,
ADD COLUMN IF NOT EXISTS dodo_payment_method_id text,
ADD COLUMN IF NOT EXISTS payment_method_saved_at timestamptz;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_dodo_customer_id ON public.users(dodo_customer_id) WHERE dodo_customer_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.users.dodo_customer_id IS 'Dodo Payment customer ID for automatic charging';
COMMENT ON COLUMN public.users.dodo_payment_method_id IS 'Dodo Payment payment method ID for automatic charging';
COMMENT ON COLUMN public.users.payment_method_saved_at IS 'Timestamp when payment method was saved';

