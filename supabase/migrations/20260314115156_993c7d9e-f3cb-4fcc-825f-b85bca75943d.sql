
-- Add pricing and billing columns to client_services
ALTER TABLE public.client_services 
  ADD COLUMN IF NOT EXISTS price_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS billing_cycle text DEFAULT 'one_time',
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'eft',
  ADD COLUMN IF NOT EXISTS renewal_date date,
  ADD COLUMN IF NOT EXISTS reminder_days_before integer DEFAULT 30;

-- Add payment_method to clients table
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'eft';

-- Update existing RLS if needed - client_services should already have policies
-- Let's verify and add if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'client_services' AND policyname = 'client_services_select'
  ) THEN
    ALTER TABLE public.client_services ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "client_services_select" ON public.client_services FOR SELECT TO authenticated USING (true);
    CREATE POLICY "client_services_insert" ON public.client_services FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "client_services_update" ON public.client_services FOR UPDATE TO authenticated USING (true);
    CREATE POLICY "client_services_delete" ON public.client_services FOR DELETE TO authenticated USING (true);
  END IF;
END $$;
