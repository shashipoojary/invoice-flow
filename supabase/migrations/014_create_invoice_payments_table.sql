-- Create invoice_payments table for tracking partial payments
-- This allows freelancers to track deposits, milestone payments, etc.

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

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice_id ON public.invoice_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_user_id ON public.invoice_payments(user_id);

-- Enable RLS
ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own invoice payments" ON public.invoice_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.invoices i 
      WHERE i.id = invoice_payments.invoice_id 
      AND i.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own invoice payments" ON public.invoice_payments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invoices i 
      WHERE i.id = invoice_payments.invoice_id 
      AND i.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own invoice payments" ON public.invoice_payments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.invoices i 
      WHERE i.id = invoice_payments.invoice_id 
      AND i.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own invoice payments" ON public.invoice_payments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.invoices i 
      WHERE i.id = invoice_payments.invoice_id 
      AND i.user_id = auth.uid()
    )
  );

-- Add comment
COMMENT ON TABLE public.invoice_payments IS 'Tracks partial payments for invoices (deposits, milestones, etc.)';

