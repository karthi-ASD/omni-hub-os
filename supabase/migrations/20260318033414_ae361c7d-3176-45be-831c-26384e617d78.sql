
-- Client Packages
CREATE TABLE IF NOT EXISTS public.client_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  package_name text NOT NULL DEFAULT 'Standard Package',
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  contract_type text NOT NULL DEFAULT 'month_on_month',
  payment_type text NOT NULL DEFAULT 'monthly',
  total_value numeric NOT NULL DEFAULT 0,
  account_manager_id uuid,
  seo_manager_id uuid,
  competitor_visibility boolean NOT NULL DEFAULT true,
  ranking_mode text NOT NULL DEFAULT 'auto',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Package Services
CREATE TABLE IF NOT EXISTS public.package_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.client_packages(id) ON DELETE CASCADE,
  service_name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  price numeric NOT NULL DEFAULT 0,
  billing_cycle text NOT NULL DEFAULT 'monthly',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- SEO Package Data
CREATE TABLE IF NOT EXISTS public.seo_package_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.client_packages(id) ON DELETE CASCADE,
  radius_km numeric DEFAULT 0,
  suburbs jsonb DEFAULT '[]'::jsonb,
  keyword_count integer DEFAULT 0,
  strategy_type text NOT NULL DEFAULT 'local',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Client Assets (package-linked)
CREATE TABLE IF NOT EXISTS public.client_package_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.client_packages(id) ON DELETE CASCADE,
  domain_name text,
  registrar text,
  domain_login_encrypted text,
  domain_renewal_date date,
  hosting_provider text,
  hosting_login_encrypted text,
  hosting_renewal_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add package_id to existing client_social_links if not present
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_social_links' AND column_name = 'package_id') THEN
    ALTER TABLE public.client_social_links ADD COLUMN package_id uuid REFERENCES public.client_packages(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Client GMB
CREATE TABLE IF NOT EXISTS public.client_gmb (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.client_packages(id) ON DELETE CASCADE,
  gmb_link text,
  access_status text DEFAULT 'pending',
  managed_by text DEFAULT 'client',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Package Installments
CREATE TABLE IF NOT EXISTS public.package_installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.client_packages(id) ON DELETE CASCADE,
  installment_number integer NOT NULL,
  due_date date NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  paid_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Package Events
CREATE TABLE IF NOT EXISTS public.package_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.client_packages(id) ON DELETE CASCADE,
  event_name text NOT NULL,
  event_date date,
  total_cost numeric NOT NULL DEFAULT 0,
  payment_type text NOT NULL DEFAULT 'one_time',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.client_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_package_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_package_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_gmb ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "pkg_select" ON public.client_packages FOR SELECT TO authenticated USING (
  business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid())
  OR client_id IN (SELECT client_id FROM public.client_users WHERE user_id = auth.uid())
);
CREATE POLICY "pkg_manage" ON public.client_packages FOR ALL TO authenticated USING (
  business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid())
) WITH CHECK (
  business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "ps_select" ON public.package_services FOR SELECT TO authenticated USING (
  package_id IN (SELECT id FROM public.client_packages WHERE business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid())
    OR client_id IN (SELECT client_id FROM public.client_users WHERE user_id = auth.uid()))
);
CREATE POLICY "ps_manage" ON public.package_services FOR ALL TO authenticated USING (
  package_id IN (SELECT id FROM public.client_packages WHERE business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()))
) WITH CHECK (
  package_id IN (SELECT id FROM public.client_packages WHERE business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()))
);

CREATE POLICY "spd_select" ON public.seo_package_data FOR SELECT TO authenticated USING (
  package_id IN (SELECT id FROM public.client_packages WHERE business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid())
    OR client_id IN (SELECT client_id FROM public.client_users WHERE user_id = auth.uid()))
);
CREATE POLICY "spd_manage" ON public.seo_package_data FOR ALL TO authenticated USING (
  package_id IN (SELECT id FROM public.client_packages WHERE business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()))
) WITH CHECK (
  package_id IN (SELECT id FROM public.client_packages WHERE business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()))
);

CREATE POLICY "cpa_select" ON public.client_package_assets FOR SELECT TO authenticated USING (
  package_id IN (SELECT id FROM public.client_packages WHERE business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid())
    OR client_id IN (SELECT client_id FROM public.client_users WHERE user_id = auth.uid()))
);
CREATE POLICY "cpa_manage" ON public.client_package_assets FOR ALL TO authenticated USING (
  package_id IN (SELECT id FROM public.client_packages WHERE business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()))
) WITH CHECK (
  package_id IN (SELECT id FROM public.client_packages WHERE business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()))
);

CREATE POLICY "gmb_select" ON public.client_gmb FOR SELECT TO authenticated USING (
  package_id IN (SELECT id FROM public.client_packages WHERE business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid())
    OR client_id IN (SELECT client_id FROM public.client_users WHERE user_id = auth.uid()))
);
CREATE POLICY "gmb_manage" ON public.client_gmb FOR ALL TO authenticated USING (
  package_id IN (SELECT id FROM public.client_packages WHERE business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()))
) WITH CHECK (
  package_id IN (SELECT id FROM public.client_packages WHERE business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()))
);

CREATE POLICY "pi_select" ON public.package_installments FOR SELECT TO authenticated USING (
  package_id IN (SELECT id FROM public.client_packages WHERE business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid())
    OR client_id IN (SELECT client_id FROM public.client_users WHERE user_id = auth.uid()))
);
CREATE POLICY "pi_manage" ON public.package_installments FOR ALL TO authenticated USING (
  package_id IN (SELECT id FROM public.client_packages WHERE business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()))
) WITH CHECK (
  package_id IN (SELECT id FROM public.client_packages WHERE business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()))
);

CREATE POLICY "pe_select" ON public.package_events FOR SELECT TO authenticated USING (
  package_id IN (SELECT id FROM public.client_packages WHERE business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid())
    OR client_id IN (SELECT client_id FROM public.client_users WHERE user_id = auth.uid()))
);
CREATE POLICY "pe_manage" ON public.package_events FOR ALL TO authenticated USING (
  package_id IN (SELECT id FROM public.client_packages WHERE business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()))
) WITH CHECK (
  package_id IN (SELECT id FROM public.client_packages WHERE business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()))
);
