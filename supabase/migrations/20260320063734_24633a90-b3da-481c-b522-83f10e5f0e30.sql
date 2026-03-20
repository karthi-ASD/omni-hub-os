
-- Add assigned_to field to nextweb_service_requests
ALTER TABLE public.nextweb_service_requests ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id);

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_nextweb_requests_assigned_to ON public.nextweb_service_requests(assigned_to);
