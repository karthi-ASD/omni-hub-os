
-- Add salesperson_owner field to clients table
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS salesperson_owner text;

-- Create index for filtering by salesperson
CREATE INDEX IF NOT EXISTS idx_clients_salesperson_owner ON public.clients(salesperson_owner);
