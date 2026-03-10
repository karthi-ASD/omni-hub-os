
-- Add client_id to support_tickets if not exists
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_client_id ON public.support_tickets(client_id);

-- Add client_id to contracts if not exists
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id);
CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON public.contracts(client_id);

-- Create client_websites table
CREATE TABLE public.client_websites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  website_url TEXT NOT NULL,
  cms_type TEXT,
  hosting_provider TEXT,
  domain_provider TEXT,
  website_status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_websites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view client websites in their business"
  ON public.client_websites FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Users can insert client websites in their business"
  ON public.client_websites FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Users can update client websites in their business"
  ON public.client_websites FOR UPDATE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Users can delete client websites in their business"
  ON public.client_websites FOR DELETE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

CREATE INDEX idx_client_websites_client_id ON public.client_websites(client_id);

-- Create client_mobile_apps table
CREATE TABLE public.client_mobile_apps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  app_name TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'Android',
  app_status TEXT NOT NULL DEFAULT 'planning',
  app_store_link TEXT,
  play_store_link TEXT,
  app_category TEXT,
  features_json JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_mobile_apps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view client apps in their business"
  ON public.client_mobile_apps FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Users can insert client apps in their business"
  ON public.client_mobile_apps FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Users can update client apps in their business"
  ON public.client_mobile_apps FOR UPDATE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Users can delete client apps in their business"
  ON public.client_mobile_apps FOR DELETE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

CREATE INDEX idx_client_mobile_apps_client_id ON public.client_mobile_apps(client_id);

-- Update client_services table to add missing columns
ALTER TABLE public.client_services ADD COLUMN IF NOT EXISTS service_category TEXT;
ALTER TABLE public.client_services ADD COLUMN IF NOT EXISTS service_status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE public.client_services ADD COLUMN IF NOT EXISTS assigned_department TEXT;
