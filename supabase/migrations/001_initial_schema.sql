-- InvoiceFlow Pro - Initial Schema Migration
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- clients table
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  email text,
  company text,
  phone text,
  address text,
  created_at timestamptz DEFAULT now()
);

-- invoices table
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id uuid NOT NULL,
  invoice_number text NOT NULL,
  public_token text NOT NULL, -- secure random token for hosted page
  currency text DEFAULT 'INR',
  subtotal numeric NOT NULL,
  tax numeric DEFAULT 0,
  discount numeric DEFAULT 0,
  total numeric NOT NULL,
  due_date date,
  status text DEFAULT 'draft', -- draft | sent | paid | overdue | cancelled
  branding jsonb DEFAULT '{}', -- {logo_url, business_name, color}
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- invoice_items table
CREATE TABLE public.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  qty numeric DEFAULT 1,
  rate numeric NOT NULL,
  line_total numeric NOT NULL
);

-- payments table (stores payment events and platform charges)
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid,
  user_id uuid NOT NULL,
  provider text NOT NULL, -- stripe | paypal
  provider_payment_id text,
  amount numeric NOT NULL,
  currency text,
  status text, -- pending | succeeded | failed | refunded
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- invoice_pdfs table
CREATE TABLE public.invoice_pdfs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- billing_records table (for pay-per-invoice charges)
CREATE TABLE public.billing_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  invoice_id uuid,
  type text NOT NULL, -- 'per_invoice_fee' | 'subscription'
  amount numeric NOT NULL,
  currency text DEFAULT 'INR',
  stripe_session_id text,
  status text DEFAULT 'pending', -- pending | paid | failed
  created_at timestamptz DEFAULT now()
);

-- user_settings table (for billing preferences)
CREATE TABLE public.user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  billing_mode text DEFAULT 'per_invoice', -- 'per_invoice' | 'subscription'
  business_name text,
  business_email text,
  business_phone text,
  business_address text,
  logo_url text,
  accent_color text DEFAULT '#3b82f6',
  platform_fee numeric DEFAULT 0.50, -- per invoice fee
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX idx_invoices_public_token ON public.invoices(public_token);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX idx_billing_records_user_id ON public.billing_records(user_id);
CREATE INDEX idx_billing_records_invoice_id ON public.billing_records(invoice_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
