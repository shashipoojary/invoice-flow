-- Add subscription_id column to users table for tracking Dodo Payment subscriptions
-- This enables proper cancellation of recurring subscriptions

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS dodo_subscription_id text,
ADD COLUMN IF NOT EXISTS subscription_cancelled_at timestamptz,
ADD COLUMN IF NOT EXISTS subscription_cancels_at_period_end boolean DEFAULT false;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_dodo_subscription_id ON public.users(dodo_subscription_id) WHERE dodo_subscription_id IS NOT NULL;

-- Add comments
COMMENT ON COLUMN public.users.dodo_subscription_id IS 'Dodo Payment subscription ID for recurring monthly subscriptions';
COMMENT ON COLUMN public.users.subscription_cancelled_at IS 'Timestamp when subscription cancellation was requested';
COMMENT ON COLUMN public.users.subscription_cancels_at_period_end IS 'If true, subscription will cancel at end of current billing period (user can use until next_billing_date)';

