-- Add qty column to invoice_items table if it doesn't exist
-- This fixes the error: "Could not find the 'qty' column of 'invoice_items' in the schema cache"

-- Add qty column if it doesn't exist
ALTER TABLE public.invoice_items 
ADD COLUMN IF NOT EXISTS qty NUMERIC DEFAULT 1;

-- Update existing rows that might have NULL qty values
UPDATE public.invoice_items 
SET qty = 1 
WHERE qty IS NULL;

-- Add a comment to document the column
COMMENT ON COLUMN public.invoice_items.qty IS 'Quantity of the item (defaults to 1)';


