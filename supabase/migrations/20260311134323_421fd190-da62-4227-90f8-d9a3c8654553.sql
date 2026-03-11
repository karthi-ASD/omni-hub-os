
-- Create client_domains table
CREATE TABLE public.client_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  domain_name TEXT NOT NULL,
  registrar_name TEXT,
  registrar_account_reference TEXT,
  registration_date DATE,
  expiry_date DATE,
  auto_renew_status BOOLEAN DEFAULT false,
  dns_provider TEXT,
  nameservers TEXT[],
  linked_website_id UUID REFERENCES public.tenant_websites(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add unique constraint on business + domain
ALTER TABLE public.client_domains ADD CONSTRAINT client_domains_business_domain_unique UNIQUE (business_id, domain_name);

-- Enable RLS
ALTER TABLE public.client_domains ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view domains in their business"
  ON public.client_domains FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can insert domains in their business"
  ON public.client_domains FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can update domains in their business"
  ON public.client_domains FOR UPDATE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can delete domains in their business"
  ON public.client_domains FOR DELETE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Auto-update updated_at
CREATE TRIGGER update_client_domains_updated_at
  BEFORE UPDATE ON public.client_domains
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
