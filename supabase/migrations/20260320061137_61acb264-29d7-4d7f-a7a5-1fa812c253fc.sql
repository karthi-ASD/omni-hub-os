-- Table: nextweb_service_requests (Client → NextWeb request system)
CREATE TABLE public.nextweb_service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  client_id UUID REFERENCES public.clients(id),
  created_by UUID NOT NULL,
  request_type TEXT NOT NULL DEFAULT 'support_issue',
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_to UUID,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.nextweb_service_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins full access" ON public.nextweb_service_requests
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Business users can view own requests" ON public.nextweb_service_requests
  FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Business users can create requests" ON public.nextweb_service_requests
  FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Business admins can update own requests" ON public.nextweb_service_requests
  FOR UPDATE TO authenticated
  USING (
    business_id = public.get_user_business_id(auth.uid())
    AND (public.has_role(auth.uid(), 'business_admin') OR created_by = auth.uid())
  );

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.nextweb_service_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_nextweb_requests_business ON public.nextweb_service_requests(business_id);
CREATE INDEX idx_nextweb_requests_status ON public.nextweb_service_requests(status);