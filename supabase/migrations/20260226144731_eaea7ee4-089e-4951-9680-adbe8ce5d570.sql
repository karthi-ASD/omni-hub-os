
-- =====================================================
-- STAGE 11: Global SaaS Scale & Infrastructure
-- =====================================================

-- A) MARKETPLACE & PLUGINS
CREATE TABLE public.plugins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  developer_name text NOT NULL DEFAULT 'NextWeb',
  description text,
  version text NOT NULL DEFAULT '1.0.0',
  entry_point text,
  permissions_required text[] DEFAULT '{}'::text[],
  pricing_type text NOT NULL DEFAULT 'free' CHECK (pricing_type IN ('free','paid','revenue_share')),
  price numeric DEFAULT 0,
  rating_avg numeric DEFAULT 0,
  install_count integer DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','deprecated')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.plugins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active plugins" ON public.plugins FOR SELECT TO authenticated USING (status = 'active');
CREATE POLICY "Super admins manage all plugins" ON public.plugins FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE TABLE public.tenant_plugins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id),
  plugin_id uuid NOT NULL REFERENCES public.plugins(id),
  enabled boolean NOT NULL DEFAULT true,
  configuration_json jsonb DEFAULT '{}'::jsonb,
  installed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(business_id, plugin_id)
);
ALTER TABLE public.tenant_plugins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business users manage own plugins" ON public.tenant_plugins FOR ALL TO authenticated USING (business_id = get_user_business_id(auth.uid()));
CREATE POLICY "Super admins manage all tenant plugins" ON public.tenant_plugins FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));

-- B) WHITE-LABEL APP FACTORY
CREATE TABLE public.app_builds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id),
  platform text NOT NULL CHECK (platform IN ('ios','android')),
  version text NOT NULL DEFAULT '1.0.0',
  build_status text NOT NULL DEFAULT 'pending' CHECK (build_status IN ('pending','building','completed','failed')),
  store_status text NOT NULL DEFAULT 'not_submitted' CHECK (store_status IN ('not_submitted','submitted','approved','rejected','live')),
  bundle_id text,
  build_log text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.app_builds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business admins manage own app builds" ON public.app_builds FOR ALL TO authenticated USING (has_role(auth.uid(), 'business_admin'::app_role) AND business_id = get_user_business_id(auth.uid()));
CREATE POLICY "Super admins manage all app builds" ON public.app_builds FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));

-- C) API USAGE TRACKING
CREATE TABLE public.api_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id uuid REFERENCES public.api_keys(id),
  endpoint text NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  cost numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins manage all api usage" ON public.api_usage_logs FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Business admins view own api usage" ON public.api_usage_logs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.api_keys ak WHERE ak.id = api_key_id AND ak.business_id = get_user_business_id(auth.uid())));

-- D) INFRASTRUCTURE NODES
CREATE TABLE public.infrastructure_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region text NOT NULL,
  role text NOT NULL DEFAULT 'primary' CHECK (role IN ('primary','replica','cdn')),
  status text NOT NULL DEFAULT 'healthy' CHECK (status IN ('healthy','degraded','down')),
  latency_ms integer DEFAULT 0,
  last_sync timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.infrastructure_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins manage infra nodes" ON public.infrastructure_nodes FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Business admins view infra nodes" ON public.infrastructure_nodes FOR SELECT TO authenticated USING (has_role(auth.uid(), 'business_admin'::app_role));

-- E) SECURITY AUDIT LOGS
CREATE TABLE public.security_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  ip_address text,
  user_agent text,
  risk_level text DEFAULT 'low' CHECK (risk_level IN ('low','medium','high','critical')),
  metadata_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins manage security logs" ON public.security_audit_logs FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Business admins view own security logs" ON public.security_audit_logs FOR SELECT TO authenticated USING (has_role(auth.uid(), 'business_admin'::app_role));

-- F) DATA WAREHOUSE FACT TABLES
CREATE TABLE public.fact_revenue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id),
  period text NOT NULL,
  revenue numeric NOT NULL DEFAULT 0,
  invoice_count integer DEFAULT 0,
  paid_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fact_revenue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins manage fact revenue" ON public.fact_revenue FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Business admins view own revenue facts" ON public.fact_revenue FOR SELECT TO authenticated USING (business_id = get_user_business_id(auth.uid()));

CREATE TABLE public.fact_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id),
  period text NOT NULL,
  total_leads integer DEFAULT 0,
  converted integer DEFAULT 0,
  conversion_rate numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fact_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins manage fact leads" ON public.fact_leads FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Business admins view own lead facts" ON public.fact_leads FOR SELECT TO authenticated USING (business_id = get_user_business_id(auth.uid()));

-- G) UPTIME MONITORING
CREATE TABLE public.uptime_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name text NOT NULL,
  endpoint text NOT NULL,
  status text NOT NULL DEFAULT 'up' CHECK (status IN ('up','down','degraded')),
  response_time_ms integer DEFAULT 0,
  checked_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.uptime_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins manage uptime checks" ON public.uptime_checks FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Business admins view uptime checks" ON public.uptime_checks FOR SELECT TO authenticated USING (has_role(auth.uid(), 'business_admin'::app_role));

-- H) DEPLOYMENT LOGS
CREATE TABLE public.deployment_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL,
  environment text NOT NULL DEFAULT 'production' CHECK (environment IN ('development','staging','production')),
  deployed_by uuid,
  status text NOT NULL DEFAULT 'success' CHECK (status IN ('success','failed','rolled_back')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.deployment_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins manage deployment logs" ON public.deployment_logs FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));

-- I) COMPLIANCE / DATA EXPORT
CREATE TABLE public.compliance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id),
  request_type text NOT NULL CHECK (request_type IN ('data_export','data_deletion','access_report','audit_export')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  requested_by uuid,
  file_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
ALTER TABLE public.compliance_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business admins manage own compliance" ON public.compliance_requests FOR ALL TO authenticated USING (has_role(auth.uid(), 'business_admin'::app_role) AND business_id = get_user_business_id(auth.uid()));
CREATE POLICY "Super admins manage all compliance" ON public.compliance_requests FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Indexes
CREATE INDEX idx_tenant_plugins_business ON public.tenant_plugins(business_id);
CREATE INDEX idx_app_builds_business ON public.app_builds(business_id);
CREATE INDEX idx_api_usage_key ON public.api_usage_logs(api_key_id);
CREATE INDEX idx_security_audit_user ON public.security_audit_logs(user_id);
CREATE INDEX idx_uptime_service ON public.uptime_checks(service_name);
CREATE INDEX idx_fact_revenue_period ON public.fact_revenue(period);
CREATE INDEX idx_fact_leads_period ON public.fact_leads(period);
