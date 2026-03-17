-- Add client_business_id column to clients table
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS client_business_id UUID REFERENCES public.businesses(id);

-- Add index for quick lookups
CREATE INDEX IF NOT EXISTS idx_clients_client_business_id ON public.clients(client_business_id);

-- Helper function to check if a user is a client user
CREATE OR REPLACE FUNCTION public.is_client_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.client_users
    WHERE user_id = _user_id AND is_primary = true
  )
$$;

-- Helper function to get client_id for a user
CREATE OR REPLACE FUNCTION public.get_client_id_for_user(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT client_id FROM public.client_users
  WHERE user_id = _user_id AND is_primary = true
  LIMIT 1
$$;