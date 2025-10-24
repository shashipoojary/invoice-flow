-- Add missing columns to users table for profile functionality

-- Add subscription-related columns if they don't exist
DO $$ 
BEGIN
  -- Add subscription_plan column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'subscription_plan') THEN
    ALTER TABLE public.users ADD COLUMN subscription_plan text DEFAULT 'free';
  END IF;
  
  -- Add subscription_status column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'subscription_status') THEN
    ALTER TABLE public.users ADD COLUMN subscription_status text DEFAULT 'active';
  END IF;
  
  -- Add next_billing_date column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'next_billing_date') THEN
    ALTER TABLE public.users ADD COLUMN next_billing_date timestamptz;
  END IF;
END $$;

-- Update existing users to have default subscription values
UPDATE public.users 
SET 
  subscription_plan = 'free',
  subscription_status = 'active'
WHERE subscription_plan IS NULL OR subscription_status IS NULL;
