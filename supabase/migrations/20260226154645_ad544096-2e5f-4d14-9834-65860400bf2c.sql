
-- Client Health Scores
CREATE TABLE public.client_health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL,
  score INT NOT NULL DEFAULT 50,
  risk_level TEXT NOT NULL DEFAULT 'GREEN',
  reasons_json JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, client_id)
);
ALTER TABLE public.client_health_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_or_super_health" ON public.client_health_scores FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Lead Scores
CREATE TABLE public.lead_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  lead_id TEXT NOT NULL,
  score INT NOT NULL DEFAULT 0,
  tier TEXT NOT NULL DEFAULT 'COLD',
  reasons_json JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, lead_id)
);
ALTER TABLE public.lead_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_or_super_lead_scores" ON public.lead_scores FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Duplicate Candidates
CREATE TABLE public.duplicate_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL DEFAULT 'LEAD',
  entity_id TEXT NOT NULL,
  candidate_entity_id TEXT NOT NULL,
  match_score INT NOT NULL DEFAULT 0,
  match_reasons_json JSONB,
  status TEXT NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.duplicate_candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_or_super_dupes" ON public.duplicate_candidates FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Import Jobs
CREATE TABLE public.import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL DEFAULT 'LEADS',
  file_url TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  total_rows INT DEFAULT 0,
  success_rows INT DEFAULT 0,
  failed_rows INT DEFAULT 0,
  error_report_url TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_or_super_import" ON public.import_jobs FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Export Jobs
CREATE TABLE public.export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL DEFAULT 'LEADS',
  filters_json JSONB,
  status TEXT NOT NULL DEFAULT 'PENDING',
  file_url TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.export_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_or_super_export" ON public.export_jobs FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Approval Requests
CREATE TABLE public.approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL DEFAULT 'GENERAL',
  entity_type TEXT,
  entity_id TEXT,
  requested_by UUID,
  approver_user_id UUID,
  status TEXT NOT NULL DEFAULT 'PENDING',
  reason TEXT,
  decision_comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at TIMESTAMPTZ
);
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_or_super_approvals" ON public.approval_requests FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Vault Policy Settings
CREATE TABLE public.vault_policy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  require_reauth_on_view BOOLEAN NOT NULL DEFAULT false,
  allowed_roles_json JSONB,
  max_views_per_day INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id)
);
ALTER TABLE public.vault_policy_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_or_super_vault_policy" ON public.vault_policy_settings FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Theme Settings
CREATE TABLE public.theme_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  theme_name TEXT NOT NULL DEFAULT 'Classic Blue',
  primary_color TEXT NOT NULL DEFAULT '220 70% 50%',
  secondary_color TEXT NOT NULL DEFAULT '210 40% 90%',
  accent_color TEXT NOT NULL DEFAULT '200 80% 55%',
  mode TEXT NOT NULL DEFAULT 'SYSTEM',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id)
);
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_or_super_themes" ON public.theme_settings FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
