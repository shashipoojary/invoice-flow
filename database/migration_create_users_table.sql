-- =====================================================
-- MIGRATION: CREATE USERS TABLE FOR AUTH
-- =====================================================
-- This migration creates a users table to replace Supabase Auth
-- Run this AFTER importing complete_setup.sql
-- 
-- IMPORTANT: You'll need to migrate existing users from Supabase Auth
-- See migration script: migrate-users-from-supabase.ts

-- =====================================================
-- 1. CREATE USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'monthly', 'pay_per_invoice')),
  subscription_id TEXT,
  dodo_subscription_id TEXT,
  pay_per_invoice_activated_at TIMESTAMPTZ,
  email_verified BOOLEAN DEFAULT false,
  email_verification_token TEXT,
  password_reset_token TEXT,
  password_reset_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. CREATE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_subscription_plan ON public.users(subscription_plan);
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON public.users(email_verification_token) WHERE email_verification_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON public.users(password_reset_token) WHERE password_reset_token IS NOT NULL;

-- =====================================================
-- 3. UPDATE FOREIGN KEY REFERENCES
-- =====================================================
-- Note: If you have existing tables referencing auth.users, you'll need to:
-- 1. Update foreign keys to reference public.users instead
-- 2. Migrate data from auth.users to public.users

-- Example: Update profiles table foreign key (if needed)
-- ALTER TABLE public.profiles 
--   DROP CONSTRAINT IF EXISTS profiles_id_fkey,
--   ADD CONSTRAINT profiles_id_fkey 
--   FOREIGN KEY (id) REFERENCES public.users(id) ON DELETE CASCADE;

-- =====================================================
-- 4. CREATE TRIGGER FOR UPDATED_AT
-- =====================================================
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 5. GRANT PERMISSIONS
-- =====================================================
-- Grant necessary permissions (adjust based on your setup)
-- GRANT ALL ON public.users TO invoiceuser;
-- GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO invoiceuser;

-- =====================================================
-- NOTES
-- =====================================================
-- After running this migration:
-- 1. Update all foreign key references from auth.users to public.users
-- 2. Migrate existing user data from Supabase Auth
-- 3. Update application code to use new users table
-- 4. Test authentication flow thoroughly

