
-- Phase 1/3 Fixes: Add project_id, last_accessed_at, last_decrypted_at columns
ALTER TABLE public.client_access_credentials 
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.seo_projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_accessed_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_decrypted_at timestamptz;

ALTER TABLE public.client_project_integrations
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.seo_projects(id) ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_cac_client_id ON public.client_access_credentials(client_id);
CREATE INDEX IF NOT EXISTS idx_cac_business_id ON public.client_access_credentials(business_id);
CREATE INDEX IF NOT EXISTS idx_cac_project_id ON public.client_access_credentials(project_id);
CREATE INDEX IF NOT EXISTS idx_cac_status ON public.client_access_credentials(status);
CREATE INDEX IF NOT EXISTS idx_cpi_client_id ON public.client_project_integrations(client_id);
CREATE INDEX IF NOT EXISTS idx_cpi_business_id ON public.client_project_integrations(business_id);
CREATE INDEX IF NOT EXISTS idx_cpi_project_id ON public.client_project_integrations(project_id);
CREATE INDEX IF NOT EXISTS idx_caal_client_id ON public.client_access_audit_logs(client_id);

-- Unique constraint to prevent duplicates (provider + client + type)
CREATE UNIQUE INDEX IF NOT EXISTS idx_cac_unique_provider 
  ON public.client_access_credentials(client_id, credential_type, provider_name) 
  WHERE is_archived = false AND provider_name IS NOT NULL;

-- Phase 4: Analytics/SEO/Ads snapshot tables
CREATE TABLE IF NOT EXISTS public.analytics_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.seo_projects(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'ga',
  date date NOT NULL DEFAULT CURRENT_DATE,
  metrics_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_as_client_date ON public.analytics_snapshots(client_id, date);
CREATE INDEX IF NOT EXISTS idx_as_source ON public.analytics_snapshots(source);

CREATE TABLE IF NOT EXISTS public.ads_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.seo_projects(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'google_ads',
  date date NOT NULL DEFAULT CURRENT_DATE,
  metrics_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ads_client_date ON public.ads_snapshots(client_id, date);

CREATE TABLE IF NOT EXISTS public.seo_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.seo_projects(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'gsc',
  date date NOT NULL DEFAULT CURRENT_DATE,
  metrics_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_seo_client_date ON public.seo_snapshots(client_id, date);

CREATE TABLE IF NOT EXISTS public.roi_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.seo_projects(id) ON DELETE SET NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_spend numeric DEFAULT 0,
  leads_generated integer DEFAULT 0,
  estimated_revenue numeric DEFAULT 0,
  roi_multiple numeric DEFAULT 0,
  breakdown_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_roi_client ON public.roi_metrics(client_id);

CREATE TABLE IF NOT EXISTS public.ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.seo_projects(id) ON DELETE SET NULL,
  insight_type text NOT NULL DEFAULT 'performance',
  title text NOT NULL,
  description text,
  severity text NOT NULL DEFAULT 'info',
  source_data_json jsonb DEFAULT '{}'::jsonb,
  is_dismissed boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_insights_client ON public.ai_insights(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_insights_type ON public.ai_insights(insight_type);

-- RLS for new tables
ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roi_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- Staff policies (business_id match)
CREATE POLICY "Staff can view analytics_snapshots" ON public.analytics_snapshots
  FOR SELECT TO authenticated
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Staff can insert analytics_snapshots" ON public.analytics_snapshots
  FOR INSERT TO authenticated
  WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Staff can view ads_snapshots" ON public.ads_snapshots
  FOR SELECT TO authenticated
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Staff can insert ads_snapshots" ON public.ads_snapshots
  FOR INSERT TO authenticated
  WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Staff can view seo_snapshots" ON public.seo_snapshots
  FOR SELECT TO authenticated
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Staff can insert seo_snapshots" ON public.seo_snapshots
  FOR INSERT TO authenticated
  WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Staff can view roi_metrics" ON public.roi_metrics
  FOR SELECT TO authenticated
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Staff can manage roi_metrics" ON public.roi_metrics
  FOR ALL TO authenticated
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Staff can view ai_insights" ON public.ai_insights
  FOR SELECT TO authenticated
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Staff can manage ai_insights" ON public.ai_insights
  FOR ALL TO authenticated
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- Client RLS: clients see their own data
CREATE POLICY "Client can view own analytics_snapshots" ON public.analytics_snapshots
  FOR SELECT TO authenticated
  USING (
    public.is_client_user(auth.uid()) AND 
    client_id = public.get_client_id_for_user(auth.uid())
  );

CREATE POLICY "Client can view own ads_snapshots" ON public.ads_snapshots
  FOR SELECT TO authenticated
  USING (
    public.is_client_user(auth.uid()) AND 
    client_id = public.get_client_id_for_user(auth.uid())
  );

CREATE POLICY "Client can view own seo_snapshots" ON public.seo_snapshots
  FOR SELECT TO authenticated
  USING (
    public.is_client_user(auth.uid()) AND 
    client_id = public.get_client_id_for_user(auth.uid())
  );

CREATE POLICY "Client can view own roi_metrics" ON public.roi_metrics
  FOR SELECT TO authenticated
  USING (
    public.is_client_user(auth.uid()) AND 
    client_id = public.get_client_id_for_user(auth.uid())
  );

CREATE POLICY "Client can view own ai_insights" ON public.ai_insights
  FOR SELECT TO authenticated
  USING (
    public.is_client_user(auth.uid()) AND 
    client_id = public.get_client_id_for_user(auth.uid())
  );

-- Service role policies for edge functions
CREATE POLICY "Service role full access analytics_snapshots" ON public.analytics_snapshots
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ads_snapshots" ON public.ads_snapshots
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access seo_snapshots" ON public.seo_snapshots
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access roi_metrics" ON public.roi_metrics
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ai_insights" ON public.ai_insights
  FOR ALL TO service_role USING (true) WITH CHECK (true);
