
-- Add missing columns to client_services for recurring billing
ALTER TABLE public.client_services
  ADD COLUMN IF NOT EXISTS service_name text,
  ADD COLUMN IF NOT EXISTS billing_date integer,
  ADD COLUMN IF NOT EXISTS next_billing_date date,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS assigned_salesperson_id uuid,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Add trigger for updated_at
CREATE TRIGGER set_client_services_updated_at
  BEFORE UPDATE ON public.client_services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add comments
COMMENT ON COLUMN public.client_services.billing_date IS 'Day of month for billing (1-31)';
COMMENT ON COLUMN public.client_services.next_billing_date IS 'Next billing date for the service';
COMMENT ON COLUMN public.client_services.payment_status IS 'pending, paid, overdue';
