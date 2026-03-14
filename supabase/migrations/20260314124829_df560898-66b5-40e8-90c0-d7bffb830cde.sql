
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS crm_access_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS mobile_access_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS mobile_subscription_start timestamptz,
  ADD COLUMN IF NOT EXISTS mobile_subscription_expiry timestamptz,
  ADD COLUMN IF NOT EXISTS mobile_app_downloads integer NOT NULL DEFAULT 0;
