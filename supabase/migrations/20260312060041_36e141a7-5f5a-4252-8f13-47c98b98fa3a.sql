
-- Add sales_owner_id (UUID) to clients table
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS sales_owner_id uuid;

-- Create index for fast sales owner lookups
CREATE INDEX IF NOT EXISTS idx_clients_sales_owner_id ON public.clients(sales_owner_id);
