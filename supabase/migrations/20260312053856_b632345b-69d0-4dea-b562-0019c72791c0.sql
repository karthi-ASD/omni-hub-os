
-- Add client_status and client_start_date columns to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS client_status text NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS client_start_date date;

-- Create index for fast filtering by status
CREATE INDEX IF NOT EXISTS idx_clients_client_status ON public.clients(client_status);

-- Set existing clients with onboarding_status='completed' to 'active'
UPDATE public.clients SET client_status = 'active' WHERE onboarding_status = 'completed';
-- Set existing clients with onboarding_status='in_progress' to 'active'  
UPDATE public.clients SET client_status = 'active' WHERE onboarding_status = 'in_progress';
-- Leave 'pending' onboarding_status as 'pending' client_status (default)
