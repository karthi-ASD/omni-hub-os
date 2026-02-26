
-- Demo configurations per tenant
CREATE TABLE public.demo_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  demo_enabled BOOLEAN NOT NULL DEFAULT false,
  demo_profile_type TEXT NOT NULL DEFAULT 'GENERAL',
  demo_phone TEXT,
  demo_whatsapp TEXT,
  demo_email TEXT,
  expiry_at TIMESTAMPTZ,
  reset_allowed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id)
);
ALTER TABLE public.demo_configurations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_demo_config" ON public.demo_configurations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Demo inquiry simulations
CREATE TABLE public.demo_inquiry_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  simulated_name TEXT NOT NULL,
  simulated_phone TEXT,
  simulated_email TEXT,
  simulated_service TEXT,
  inquiry_id UUID,
  is_demo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.demo_inquiry_simulations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_demo_sim" ON public.demo_inquiry_simulations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Inquiry analytics daily rollup
CREATE TABLE public.inquiry_analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_inquiries INT NOT NULL DEFAULT 0,
  demo_inquiries INT NOT NULL DEFAULT 0,
  responded_count INT NOT NULL DEFAULT 0,
  converted_count INT NOT NULL DEFAULT 0,
  average_response_time_minutes NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, date)
);
ALTER TABLE public.inquiry_analytics_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_inquiry_analytics" ON public.inquiry_analytics_daily FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Demo jobs for simulation
CREATE TABLE public.demo_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  simulated_customer TEXT NOT NULL,
  job_title TEXT NOT NULL DEFAULT 'Demo Job',
  status TEXT NOT NULL DEFAULT 'NEW',
  is_demo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.demo_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_demo_jobs" ON public.demo_jobs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
