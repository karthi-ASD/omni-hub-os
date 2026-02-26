
-- FIX: Attach missing triggers
DROP TRIGGER IF EXISTS on_business_status_change ON public.businesses;
CREATE TRIGGER on_business_status_change
  AFTER INSERT OR UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.notify_business_status_change();

DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_user_created();

-- =====================================================
-- STAGE 15: Production Hardening
-- =====================================================

CREATE TABLE IF NOT EXISTS public.system_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OK',
  latency_ms INTEGER,
  error_message TEXT,
  last_checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.system_health_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_health_checks" ON public.system_health_checks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE TABLE IF NOT EXISTS public.job_run_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  business_id UUID REFERENCES public.businesses(id),
  status TEXT NOT NULL DEFAULT 'SUCCESS',
  duration_ms INTEGER,
  error_message TEXT,
  run_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.job_run_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_job_run_logs" ON public.job_run_logs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE TABLE IF NOT EXISTS public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  severity TEXT NOT NULL DEFAULT 'SEV3',
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  owner_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_incidents" ON public.incidents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE TABLE IF NOT EXISTS public.incident_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);
ALTER TABLE public.incident_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_incident_updates" ON public.incident_updates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE TABLE IF NOT EXISTS public.backup_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type TEXT NOT NULL DEFAULT 'DB_SNAPSHOT',
  frequency TEXT NOT NULL DEFAULT 'DAILY',
  retention_days INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.backup_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_backup_jobs" ON public.backup_jobs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE TABLE IF NOT EXISTS public.backup_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_job_id UUID NOT NULL REFERENCES public.backup_jobs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'RUNNING',
  backup_location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  error_message TEXT
);
ALTER TABLE public.backup_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_backup_runs" ON public.backup_runs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE TABLE IF NOT EXISTS public.secrets_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_level TEXT NOT NULL DEFAULT 'PLATFORM',
  business_id UUID REFERENCES public.businesses(id),
  provider TEXT NOT NULL,
  secret_type TEXT NOT NULL,
  last_rotated_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.secrets_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_secrets_registry" ON public.secrets_registry FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE TABLE IF NOT EXISTS public.data_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_level TEXT NOT NULL DEFAULT 'PLATFORM',
  business_id UUID REFERENCES public.businesses(id),
  logs_retention_days INTEGER NOT NULL DEFAULT 90,
  analytics_retention_days INTEGER NOT NULL DEFAULT 365,
  ticket_retention_days INTEGER NOT NULL DEFAULT 730,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.data_retention_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_data_retention" ON public.data_retention_policies FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE TABLE IF NOT EXISTS public.data_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type TEXT NOT NULL DEFAULT 'EXPORT',
  requester_user_id UUID,
  business_id UUID REFERENCES public.businesses(id),
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
ALTER TABLE public.data_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_data_requests" ON public.data_requests FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE TABLE IF NOT EXISTS public.releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'DEV',
  status TEXT NOT NULL DEFAULT 'PLANNED',
  deployed_at TIMESTAMPTZ,
  deployed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.releases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_releases" ON public.releases FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE TABLE IF NOT EXISTS public.migration_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id UUID NOT NULL REFERENCES public.releases(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'PENDING',
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  error_message TEXT
);
ALTER TABLE public.migration_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_migration_runs" ON public.migration_runs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_level TEXT NOT NULL DEFAULT 'PLATFORM',
  business_id UUID REFERENCES public.businesses(id),
  flag_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(flag_key, scope_level, business_id)
);
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_feature_flags" ON public.feature_flags FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));
