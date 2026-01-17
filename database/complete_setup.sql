-- =====================================================
-- FLOWINVOICER COMPLETE DATABASE SETUP
-- =====================================================
-- Run this entire script in Supabase SQL Editor
-- This will create all tables, policies, functions, and triggers
-- Use this for new installations

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PROFILES TABLE (extends auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  business_name TEXT,
  business_address TEXT,
  business_email TEXT,
  business_phone TEXT,
  logo_url TEXT,
  accent_color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. CLIENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  company TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. INVOICES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  invoice_number TEXT NOT NULL,
  public_token TEXT NOT NULL UNIQUE,
  currency TEXT DEFAULT 'USD',
  subtotal NUMERIC NOT NULL,
  tax NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  due_date DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  branding JSONB DEFAULT '{}',
  notes TEXT,
  reminder_settings JSONB DEFAULT '{"enabled": false, "useSystemDefaults": true, "customRules": []}'::jsonb,
  reminder_count INTEGER DEFAULT 0,
  last_reminder_sent TIMESTAMPTZ,
  issue_date DATE,
  payment_terms JSONB DEFAULT '{}',
  theme JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. INVOICE ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  qty NUMERIC DEFAULT 1,
  rate NUMERIC NOT NULL,
  line_total NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. INVOICE PAYMENTS TABLE (Partial Payments)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.invoice_payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. PAYMENTS TABLE (Platform Payments)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL,
  provider_payment_id TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT,
  status TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. INVOICE PDFS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.invoice_pdfs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. BILLING RECORDS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.billing_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('per_invoice_fee', 'subscription')),
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  stripe_session_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 9. PAYMENT METHODS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  paypal_email TEXT,
  venmo_username TEXT,
  google_pay TEXT,
  upi_id TEXT,
  bank_transfer_details TEXT,
  payment_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 10. INVOICE REMINDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.invoice_reminders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  reminder_type VARCHAR(20) NOT NULL CHECK (reminder_type IN ('friendly', 'polite', 'firm', 'urgent')),
  reminder_status TEXT DEFAULT 'pending' CHECK (reminder_status IN ('pending', 'sent', 'cancelled')),
  overdue_days INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ,
  email_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 11. ESTIMATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.estimates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  estimate_number TEXT NOT NULL,
  public_token TEXT NOT NULL UNIQUE,
  currency TEXT DEFAULT 'USD',
  subtotal NUMERIC NOT NULL,
  tax NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  expiry_date DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'rejected', 'expired', 'converted')),
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  converted_to_invoice_id UUID REFERENCES public.invoices(id),
  branding JSONB DEFAULT '{}',
  notes TEXT,
  issue_date DATE,
  payment_terms JSONB DEFAULT '{}',
  theme JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 12. ESTIMATE ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.estimate_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  estimate_id UUID REFERENCES public.estimates(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  qty NUMERIC DEFAULT 1,
  rate NUMERIC NOT NULL,
  line_total NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 13. ESTIMATE EVENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.estimate_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  estimate_id UUID REFERENCES public.estimates(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 14. INVOICE EVENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.invoice_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 15. USER SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  billing_mode TEXT DEFAULT 'per_invoice' CHECK (billing_mode IN ('per_invoice', 'subscription')),
  business_name TEXT,
  business_email TEXT,
  business_phone TEXT,
  business_address TEXT,
  logo_url TEXT,
  accent_color TEXT DEFAULT '#3b82f6',
  platform_fee NUMERIC DEFAULT 0.50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 16. ADD COLUMNS TO USERS TABLE (via auth.users)
-- =====================================================
-- Note: These columns are added via Supabase dashboard or migrations
-- subscription_plan, subscription_id, dodo_subscription_id, etc.

-- =====================================================
-- 17. CREATE INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_public_token ON public.invoices(public_token);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice_id ON public.invoice_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_user_id ON public.invoice_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_billing_records_user_id ON public.billing_records(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON public.payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_invoice_reminders_invoice_id ON public.invoice_reminders(invoice_id);
CREATE INDEX IF NOT EXISTS idx_estimates_user_id ON public.estimates(user_id);
CREATE INDEX IF NOT EXISTS idx_estimates_client_id ON public.estimates(client_id);
CREATE INDEX IF NOT EXISTS idx_estimates_status ON public.estimates(status);
CREATE INDEX IF NOT EXISTS idx_estimates_public_token ON public.estimates(public_token);
CREATE INDEX IF NOT EXISTS idx_estimate_items_estimate_id ON public.estimate_items(estimate_id);
CREATE INDEX IF NOT EXISTS idx_estimate_events_estimate_id ON public.estimate_events(estimate_id);
CREATE INDEX IF NOT EXISTS idx_invoice_events_invoice_id ON public.invoice_events(invoice_id);

-- =====================================================
-- 18. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_pdfs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 19. CREATE RLS POLICIES
-- =====================================================

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Clients policies
CREATE POLICY "Users can view own clients" ON public.clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own clients" ON public.clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clients" ON public.clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own clients" ON public.clients FOR DELETE USING (auth.uid() = user_id);

-- Invoices policies
CREATE POLICY "Users can view own invoices" ON public.invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own invoices" ON public.invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own invoices" ON public.invoices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own invoices" ON public.invoices FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Public can view invoice by token" ON public.invoices FOR SELECT USING (true);

-- Invoice items policies
CREATE POLICY "Users can view own invoice items" ON public.invoice_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid())
);
CREATE POLICY "Users can insert own invoice items" ON public.invoice_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid())
);
CREATE POLICY "Users can update own invoice items" ON public.invoice_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid())
);
CREATE POLICY "Users can delete own invoice items" ON public.invoice_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid())
);
CREATE POLICY "Public can view invoice items by token" ON public.invoice_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id)
);

-- Invoice payments policies
CREATE POLICY "Users can view own invoice payments" ON public.invoice_payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_payments.invoice_id AND i.user_id = auth.uid())
);
CREATE POLICY "Users can insert own invoice payments" ON public.invoice_payments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_payments.invoice_id AND i.user_id = auth.uid())
);
CREATE POLICY "Users can update own invoice payments" ON public.invoice_payments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_payments.invoice_id AND i.user_id = auth.uid())
);
CREATE POLICY "Users can delete own invoice payments" ON public.invoice_payments FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_payments.invoice_id AND i.user_id = auth.uid())
);

-- Payments policies
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own payments" ON public.payments FOR UPDATE USING (auth.uid() = user_id);

-- Invoice PDFs policies
CREATE POLICY "Users can view own invoice PDFs" ON public.invoice_pdfs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_pdfs.invoice_id AND invoices.user_id = auth.uid())
);
CREATE POLICY "Users can insert own invoice PDFs" ON public.invoice_pdfs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_pdfs.invoice_id AND invoices.user_id = auth.uid())
);
CREATE POLICY "Public can view invoice PDFs by token" ON public.invoice_pdfs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_pdfs.invoice_id)
);

-- Billing records policies
CREATE POLICY "Users can view own billing records" ON public.billing_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own billing records" ON public.billing_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own billing records" ON public.billing_records FOR UPDATE USING (auth.uid() = user_id);

-- Payment methods policies
CREATE POLICY "Users can view own payment methods" ON public.payment_methods FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payment methods" ON public.payment_methods FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own payment methods" ON public.payment_methods FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own payment methods" ON public.payment_methods FOR DELETE USING (auth.uid() = user_id);

-- Invoice reminders policies
CREATE POLICY "Users can view own invoice reminders" ON public.invoice_reminders FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_reminders.invoice_id AND i.user_id = auth.uid())
);
CREATE POLICY "Users can insert own invoice reminders" ON public.invoice_reminders FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_reminders.invoice_id AND i.user_id = auth.uid())
);
CREATE POLICY "Users can update own invoice reminders" ON public.invoice_reminders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_reminders.invoice_id AND i.user_id = auth.uid())
);
CREATE POLICY "Users can delete own invoice reminders" ON public.invoice_reminders FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_reminders.invoice_id AND i.user_id = auth.uid())
);

-- Estimates policies
CREATE POLICY "Users can view own estimates" ON public.estimates FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own estimates" ON public.estimates FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own estimates" ON public.estimates FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own estimates" ON public.estimates FOR DELETE USING (user_id = auth.uid());

-- Estimate items policies
CREATE POLICY "Users can view own estimate items" ON public.estimate_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.estimates e WHERE e.id = estimate_items.estimate_id AND e.user_id = auth.uid())
);
CREATE POLICY "Users can insert own estimate items" ON public.estimate_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.estimates e WHERE e.id = estimate_items.estimate_id AND e.user_id = auth.uid())
);
CREATE POLICY "Users can update own estimate items" ON public.estimate_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.estimates e WHERE e.id = estimate_items.estimate_id AND e.user_id = auth.uid())
);
CREATE POLICY "Users can delete own estimate items" ON public.estimate_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.estimates e WHERE e.id = estimate_items.estimate_id AND e.user_id = auth.uid())
);

-- Estimate events policies
CREATE POLICY "Users can view own estimate events" ON public.estimate_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.estimates e WHERE e.id = estimate_events.estimate_id AND e.user_id = auth.uid())
);
CREATE POLICY "Users can insert own estimate events" ON public.estimate_events FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.estimates e WHERE e.id = estimate_events.estimate_id AND e.user_id = auth.uid())
);

-- Invoice events policies
CREATE POLICY "Users can view own invoice events" ON public.invoice_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_events.invoice_id AND i.user_id = auth.uid())
);
CREATE POLICY "Users can insert own invoice events" ON public.invoice_events FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_events.invoice_id AND i.user_id = auth.uid())
);

-- User settings policies
CREATE POLICY "Users can view own user settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own user settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own user settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 20. CREATE FUNCTIONS
-- =====================================================

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  
  -- Create default payment methods record
  INSERT INTO public.payment_methods (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  invoice_count INTEGER;
  invoice_number TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO invoice_count 
  FROM public.invoices 
  WHERE user_id = user_uuid;
  
  invoice_number := 'INV-' || LPAD(invoice_count::TEXT, 4, '0');
  
  RETURN invoice_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate estimate number
CREATE OR REPLACE FUNCTION public.generate_estimate_number(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  estimate_count INTEGER;
  estimate_number TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO estimate_count 
  FROM public.estimates 
  WHERE user_id = user_uuid;
  
  estimate_number := 'EST-' || LPAD(estimate_count::TEXT, 4, '0');
  
  RETURN estimate_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate public token
CREATE OR REPLACE FUNCTION public.generate_public_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 21. CREATE TRIGGERS
-- =====================================================

-- Trigger to automatically create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers to update updated_at timestamp
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoice_payments_updated_at
  BEFORE UPDATE ON public.invoice_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_estimates_updated_at
  BEFORE UPDATE ON public.estimates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 22. GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant read permissions to anonymous users for public invoice viewing
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.invoices TO anon;
GRANT SELECT ON public.invoice_items TO anon;
GRANT SELECT ON public.invoice_pdfs TO anon;
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.estimates TO anon;
GRANT SELECT ON public.estimate_items TO anon;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- 
-- You can now:
-- 1. Sign up users (profiles and payment methods will be created automatically)
-- 2. Create clients and invoices
-- 3. Generate PDFs
-- 4. Handle payments
-- 5. View public invoices by token
-- 6. Send automated reminders
-- 7. Create and manage estimates
--
-- To test, try creating a user account in your app!

