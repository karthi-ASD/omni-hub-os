
-- Add token storage and tenant ID columns to xero_connections
ALTER TABLE public.xero_connections
ADD COLUMN IF NOT EXISTS xero_tenant_id text,
ADD COLUMN IF NOT EXISTS access_token_encrypted text,
ADD COLUMN IF NOT EXISTS refresh_token_encrypted text,
ADD COLUMN IF NOT EXISTS token_expires_at timestamptz;

-- Add unique constraints for upsert support
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'xero_connections_business_id_key'
  ) THEN
    ALTER TABLE public.xero_connections ADD CONSTRAINT xero_connections_business_id_key UNIQUE (business_id);
  END IF;
END $$;

-- Add unique constraints on xero sync tables for upsert
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'xero_invoices_biz_xero_id_unique'
  ) THEN
    ALTER TABLE public.xero_invoices ADD CONSTRAINT xero_invoices_biz_xero_id_unique UNIQUE (business_id, xero_invoice_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'xero_payments_biz_xero_id_unique'
  ) THEN
    ALTER TABLE public.xero_payments ADD CONSTRAINT xero_payments_biz_xero_id_unique UNIQUE (business_id, xero_payment_id);
  END IF;
END $$;

-- Add composite unique constraint on clients for xero upsert
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clients_biz_xero_contact_unique'
  ) THEN
    ALTER TABLE public.clients ADD CONSTRAINT clients_biz_xero_contact_unique UNIQUE (business_id, xero_contact_id);
  END IF;
END $$;

-- Add forecast_snapshots table for AI forecasting
CREATE TABLE IF NOT EXISTS public.forecast_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id),
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  forecast_json jsonb,
  model_used text DEFAULT 'gemini-2.5-flash',
  confidence numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.forecast_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business members can view forecasts"
  ON public.forecast_snapshots FOR SELECT
  TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Business admins can insert forecasts"
  ON public.forecast_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));
