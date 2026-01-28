-- =====================================================
-- MULTI-CURRENCY AND ADVANCED TAX SUPPORT
-- =====================================================
-- This migration adds:
-- 1. Base currency support in user_settings
-- 2. Exchange rate and base currency amount tracking in invoices/estimates
-- 3. Tax breakdown JSON column for advanced tax support

-- =====================================================
-- 1. ADD BASE CURRENCY TO USER_SETTINGS
-- =====================================================
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS base_currency TEXT DEFAULT 'USD';

-- Create index for base_currency lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_base_currency ON public.user_settings(base_currency);

-- =====================================================
-- 2. ADD EXCHANGE RATE AND BASE CURRENCY AMOUNT TO INVOICES
-- =====================================================
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS base_currency_amount NUMERIC;

-- Update existing invoices: set exchange_rate = 1.0 and base_currency_amount = total for USD invoices
UPDATE public.invoices 
SET exchange_rate = 1.0, 
    base_currency_amount = total 
WHERE base_currency_amount IS NULL;

-- Create index for base currency amount queries
CREATE INDEX IF NOT EXISTS idx_invoices_base_currency_amount ON public.invoices(base_currency_amount);

-- =====================================================
-- 3. ADD EXCHANGE RATE AND BASE CURRENCY AMOUNT TO ESTIMATES
-- =====================================================
ALTER TABLE public.estimates 
ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS base_currency_amount NUMERIC;

-- Update existing estimates: set exchange_rate = 1.0 and base_currency_amount = total for USD estimates
UPDATE public.estimates 
SET exchange_rate = 1.0, 
    base_currency_amount = total 
WHERE base_currency_amount IS NULL;

-- Create index for base currency amount queries
CREATE INDEX IF NOT EXISTS idx_estimates_base_currency_amount ON public.estimates(base_currency_amount);

-- =====================================================
-- 4. ADD TAX BREAKDOWN JSON COLUMN TO INVOICES
-- =====================================================
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS tax_breakdown JSONB DEFAULT '[]'::jsonb;

-- Migrate existing tax data to tax_breakdown format
-- Format: [{"name": "Tax", "rate": 10, "amount": 100, "type": "percentage"}]
UPDATE public.invoices 
SET tax_breakdown = CASE 
    WHEN tax > 0 THEN jsonb_build_array(
        jsonb_build_object(
            'name', 'Tax',
            'rate', CASE 
                WHEN subtotal > 0 THEN ROUND((tax / subtotal * 100)::numeric, 2)
                ELSE 0
            END,
            'amount', tax,
            'type', 'percentage'
        )
    )
    ELSE '[]'::jsonb
END
WHERE tax_breakdown = '[]'::jsonb OR tax_breakdown IS NULL;

-- =====================================================
-- 5. ADD TAX BREAKDOWN JSON COLUMN TO ESTIMATES
-- =====================================================
ALTER TABLE public.estimates 
ADD COLUMN IF NOT EXISTS tax_breakdown JSONB DEFAULT '[]'::jsonb;

-- Migrate existing tax data to tax_breakdown format
UPDATE public.estimates 
SET tax_breakdown = CASE 
    WHEN tax > 0 THEN jsonb_build_array(
        jsonb_build_object(
            'name', 'Tax',
            'rate', CASE 
                WHEN subtotal > 0 THEN ROUND((tax / subtotal * 100)::numeric, 2)
                ELSE 0
            END,
            'amount', tax,
            'type', 'percentage'
        )
    )
    ELSE '[]'::jsonb
END
WHERE tax_breakdown = '[]'::jsonb OR tax_breakdown IS NULL;

-- =====================================================
-- 6. CREATE FUNCTION TO CALCULATE BASE CURRENCY AMOUNT
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_base_currency_amount(
    invoice_total NUMERIC,
    invoice_currency TEXT,
    base_currency TEXT,
    exchange_rate NUMERIC DEFAULT NULL
)
RETURNS NUMERIC AS $$
BEGIN
    -- If same currency, return as-is
    IF invoice_currency = base_currency THEN
        RETURN invoice_total;
    END IF;
    
    -- If exchange rate provided, use it
    IF exchange_rate IS NOT NULL AND exchange_rate > 0 THEN
        RETURN ROUND((invoice_total * exchange_rate)::numeric, 2);
    END IF;
    
    -- Otherwise return NULL (needs manual conversion)
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. CREATE FUNCTION TO CALCULATE TAX FROM BREAKDOWN
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_tax_from_breakdown(
    tax_breakdown JSONB,
    subtotal NUMERIC
)
RETURNS NUMERIC AS $$
DECLARE
    total_tax NUMERIC := 0;
    tax_item JSONB;
    tax_amount NUMERIC;
BEGIN
    -- If no breakdown, return 0
    IF tax_breakdown IS NULL OR jsonb_array_length(tax_breakdown) = 0 THEN
        RETURN 0;
    END IF;
    
    -- Calculate total tax from breakdown
    FOR tax_item IN SELECT * FROM jsonb_array_elements(tax_breakdown)
    LOOP
        -- Check if amount is directly provided
        IF tax_item->>'amount' IS NOT NULL THEN
            tax_amount := (tax_item->>'amount')::NUMERIC;
        -- Otherwise calculate from rate
        ELSIF tax_item->>'rate' IS NOT NULL THEN
            tax_amount := subtotal * ((tax_item->>'rate')::NUMERIC / 100);
        ELSE
            tax_amount := 0;
        END IF;
        
        total_tax := total_tax + tax_amount;
    END LOOP;
    
    RETURN ROUND(total_tax::numeric, 2);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- NOTES
-- =====================================================
-- 1. base_currency in user_settings: User's default currency for metrics
-- 2. exchange_rate: Rate from invoice currency to base currency (e.g., EUR to USD = 1.08)
-- 3. base_currency_amount: Total amount converted to base currency for metrics
-- 4. tax_breakdown: JSON array of tax items with name, rate, amount, type
-- 5. Existing invoices/estimates are migrated with exchange_rate = 1.0 and base_currency_amount = total
-- 6. Existing tax values are migrated to tax_breakdown format


