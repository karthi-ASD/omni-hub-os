
-- Client Integrations table
CREATE TABLE public.client_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  ga_property_id TEXT,
  gsc_property TEXT,
  google_ads_id TEXT,
  facebook_ads_id TEXT,
  website_url TEXT,
  hosting_details TEXT,
  webhook_url TEXT,
  call_tracking_number TEXT,
  whatsapp_number TEXT,
  status TEXT NOT NULL DEFAULT 'not_connected',
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id)
);

ALTER TABLE public.client_integrations ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_client_integrations_client ON public.client_integrations(client_id);
CREATE INDEX idx_client_integrations_business ON public.client_integrations(business_id);

CREATE POLICY "Super admins can manage all client integrations"
  ON public.client_integrations FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Business admins can manage tenant integrations"
  ON public.client_integrations FOR ALL
  USING (has_role(auth.uid(), 'business_admin') AND business_id = get_user_business_id(auth.uid()));

CREATE POLICY "Managers can manage tenant integrations"
  ON public.client_integrations FOR ALL
  USING (has_role(auth.uid(), 'manager') AND business_id = get_user_business_id(auth.uid()));

CREATE POLICY "Employees can view tenant integrations"
  ON public.client_integrations FOR SELECT
  USING (business_id = get_user_business_id(auth.uid()));

CREATE POLICY "Client users can view own integrations"
  ON public.client_integrations FOR SELECT
  USING (is_client_user(auth.uid()) AND client_id = get_client_id_for_user(auth.uid()));
