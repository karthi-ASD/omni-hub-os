
CREATE TABLE public.client_hosting_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  hosting_provider TEXT NOT NULL,
  hosting_plan TEXT,
  control_panel_type TEXT,
  server_location TEXT,
  ssl_status TEXT DEFAULT 'unknown',
  ssl_expiry_date DATE,
  backup_status TEXT DEFAULT 'unknown',
  renewal_date DATE,
  linked_website_id UUID REFERENCES public.tenant_websites(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_hosting_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view hosting in their business"
  ON public.client_hosting_accounts FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can insert hosting in their business"
  ON public.client_hosting_accounts FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can update hosting in their business"
  ON public.client_hosting_accounts FOR UPDATE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can delete hosting in their business"
  ON public.client_hosting_accounts FOR DELETE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_client_hosting_updated_at
  BEFORE UPDATE ON public.client_hosting_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
