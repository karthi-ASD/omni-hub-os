
-- Stage 15: Additional tables for production hardening

-- Job Run Logs
CREATE TABLE IF NOT EXISTS public.job_run_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  business_id UUID REFERENCES public.businesses(id),
  status TEXT NOT NULL DEFAULT 'SUCCESS',
  duration_ms INTEGER DEFAULT 0,
  error_message TEXT,
  run_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.job_run_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "job_run_logs_super_admin" ON public.job_run_logs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Alert Rules
CREATE TABLE IF NOT EXISTS public.alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  condition_type TEXT NOT NULL,
  threshold NUMERIC NOT NULL DEFAULT 0,
  window_minutes INTEGER NOT NULL DEFAULT 5,
  channel TEXT NOT NULL DEFAULT 'email',
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alert_rules_super_admin" ON public.alert_rules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Go-Live Checklist Items (persistent)
CREATE TABLE IF NOT EXISTS public.go_live_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  item_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT true,
  is_checked BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.go_live_checklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "go_live_super_admin" ON public.go_live_checklist FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Seed default go-live checklist items
INSERT INTO public.go_live_checklist (category, item_key, label, is_required) VALUES
  ('web', 'domain_ssl', 'Domain + SSL configured', true),
  ('web', 'env_vars', 'Environment variables set', true),
  ('web', 'smtp', 'SMTP / email provider configured', true),
  ('web', 'oauth', 'OAuth providers configured (Google)', true),
  ('web', 'payments', 'Payment gateway configured (eWAY)', true),
  ('web', 'storage', 'File storage bucket created', true),
  ('web', 'backups', 'Backup schedule enabled', true),
  ('web', 'alerts', 'Alert rules configured', true),
  ('mobile', 'apple_dev', 'Apple Developer account', true),
  ('mobile', 'appstore_keys', 'App Store Connect API keys', true),
  ('mobile', 'play_keys', 'Google Play Console credentials', true),
  ('mobile', 'build_pipeline', 'Build pipeline configured', true),
  ('mobile', 'push_notif', 'Push notifications (FCM/APNS)', true),
  ('mobile', 'deep_links', 'Deep links tested', true),
  ('mobile', 'versioning', 'Versioning tested', false),
  ('tenant', 'analytics_connect', 'Connect GA4/GSC/GBP', false),
  ('tenant', 'billing_gateway', 'Tenant billing gateway connected', true),
  ('tenant', 'comms', 'Email/SMS/WhatsApp configured', false),
  ('tenant', 'branding', 'White-label branding set', false),
  ('tenant', 'first_report', 'First report test run', false)
ON CONFLICT (item_key) DO NOTHING;

-- Dependencies registry (for wizard)
CREATE TABLE IF NOT EXISTS public.dependency_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  provider TEXT NOT NULL,
  label TEXT NOT NULL,
  scope_level TEXT NOT NULL DEFAULT 'PLATFORM',
  is_required BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'missing',
  credential_type TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.dependency_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dependency_registry_super_admin" ON public.dependency_registry FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Seed dependencies
INSERT INTO public.dependency_registry (category, provider, label, scope_level, is_required, credential_type) VALUES
  ('auth', 'GOOGLE_OAUTH', 'Google OAuth', 'PLATFORM', true, 'OAuth Client ID + Secret'),
  ('auth', 'APPLE_SIGNIN', 'Apple Sign-In', 'PLATFORM', false, 'Apple Developer keys'),
  ('email', 'SMTP', 'SMTP / SendGrid / Mailgun', 'PLATFORM', true, 'SMTP credentials or API key'),
  ('payments', 'EWAY', 'eWAY Rapid API', 'PLATFORM', true, 'API Key + Password'),
  ('payments', 'STRIPE', 'Stripe', 'TENANT', false, 'Publishable + Secret key'),
  ('accounting', 'XERO', 'Xero', 'PLATFORM', false, 'OAuth Client ID + Secret'),
  ('comms', 'WHATSAPP', 'WhatsApp Cloud API', 'TENANT', false, 'Meta Business token'),
  ('comms', 'SMS_TWILIO', 'SMS (Twilio)', 'TENANT', false, 'Account SID + Auth Token'),
  ('analytics', 'GA4', 'Google Analytics 4', 'TENANT', false, 'OAuth scopes'),
  ('analytics', 'GSC', 'Google Search Console', 'TENANT', false, 'OAuth scopes'),
  ('analytics', 'GBP', 'Google Business Profile', 'TENANT', false, 'OAuth scopes'),
  ('ads', 'GOOGLE_ADS', 'Google Ads', 'TENANT', false, 'OAuth + Developer Token'),
  ('ads', 'META_ADS', 'Meta Ads', 'TENANT', false, 'Meta Business token'),
  ('voice', 'TWILIO_VOICE', 'Twilio Voice', 'TENANT', false, 'Account SID + Auth Token'),
  ('app_publishing', 'APPLE_STORE', 'Apple App Store', 'PLATFORM', false, 'App Store Connect API keys'),
  ('app_publishing', 'GOOGLE_PLAY', 'Google Play Console', 'PLATFORM', false, 'Service Account JSON'),
  ('storage', 'STORAGE_BUCKET', 'File Storage', 'PLATFORM', true, 'Bucket configuration'),
  ('monitoring', 'SENTRY', 'Error Monitoring (Sentry)', 'PLATFORM', false, 'DSN')
ON CONFLICT DO NOTHING;
