
-- Stage 8: Enterprise Hardening Tables

-- Analytics events
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) NOT NULL,
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business users view own analytics" ON public.analytics_events FOR SELECT USING (business_id = get_user_business_id(auth.uid()));
CREATE POLICY "Business users insert own analytics" ON public.analytics_events FOR INSERT WITH CHECK (business_id = get_user_business_id(auth.uid()));
CREATE POLICY "Super admins manage all analytics" ON public.analytics_events FOR ALL USING (has_role(auth.uid(), 'super_admin'));
CREATE INDEX idx_analytics_events_business ON public.analytics_events(business_id, created_at DESC);

-- Background jobs
CREATE TABLE public.background_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id),
  job_type TEXT NOT NULL,
  payload_json JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  retries INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.background_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business admins view own jobs" ON public.background_jobs FOR SELECT USING (has_role(auth.uid(), 'business_admin') AND business_id = get_user_business_id(auth.uid()));
CREATE POLICY "Super admins manage all jobs" ON public.background_jobs FOR ALL USING (has_role(auth.uid(), 'super_admin'));
CREATE INDEX idx_jobs_status ON public.background_jobs(status, created_at);

-- System health
CREATE TABLE public.system_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'healthy',
  response_time_ms INTEGER,
  details_json JSONB,
  last_checked TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.system_health ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins view system health" ON public.system_health FOR ALL USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Business admins view system health" ON public.system_health FOR SELECT USING (has_role(auth.uid(), 'business_admin'));

-- Error logs
CREATE TABLE public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id),
  error_type TEXT NOT NULL DEFAULT 'runtime',
  message TEXT NOT NULL,
  stack_trace TEXT,
  request_path TEXT,
  user_id UUID,
  metadata_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins manage all error logs" ON public.error_logs FOR ALL USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Business admins view own error logs" ON public.error_logs FOR SELECT USING (has_role(auth.uid(), 'business_admin') AND business_id = get_user_business_id(auth.uid()));
CREATE INDEX idx_error_logs_created ON public.error_logs(created_at DESC);

-- API keys registry
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) NOT NULL,
  key_name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  scopes TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business admins manage own api keys" ON public.api_keys FOR ALL USING (has_role(auth.uid(), 'business_admin') AND business_id = get_user_business_id(auth.uid()));
CREATE POLICY "Super admins manage all api keys" ON public.api_keys FOR ALL USING (has_role(auth.uid(), 'super_admin'));

-- Rate limit tracking
CREATE TABLE public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  request_count INTEGER NOT NULL DEFAULT 1,
  max_requests INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins manage rate limits" ON public.rate_limits FOR ALL USING (has_role(auth.uid(), 'super_admin'));
CREATE INDEX idx_rate_limits_identifier ON public.rate_limits(identifier, endpoint, window_start);

-- Performance indexes on existing tables
CREATE INDEX IF NOT EXISTS idx_invoices_business_status ON public.invoices(business_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_business_status ON public.payments(business_id, status);
CREATE INDEX IF NOT EXISTS idx_deals_business_stage ON public.deals(business_id, stage);
CREATE INDEX IF NOT EXISTS idx_leads_business_status ON public.leads(business_id, status);
CREATE INDEX IF NOT EXISTS idx_inquiries_business_status ON public.inquiries(business_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_system_events_business ON public.system_events(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_business ON public.audit_logs(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_campaign ON public.seo_keywords(campaign_id);
CREATE INDEX IF NOT EXISTS idx_seo_rankings_keyword ON public.seo_rankings(keyword_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_platform_invoices_business ON public.platform_invoices(client_business_id, status);
CREATE INDEX IF NOT EXISTS idx_comms_sends_business ON public.communications_sends(business_id, created_at DESC);

-- Enable realtime for system_health
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_health;
