
-- Enable pgcrypto for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- A. Client Access Credentials
CREATE TABLE public.client_access_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  credential_type TEXT NOT NULL CHECK (credential_type IN ('hosting', 'domain', 'website')),
  provider_name TEXT,
  domain_name TEXT,
  platform_type TEXT,
  url TEXT,
  login_url TEXT,
  username TEXT,
  password_encrypted TEXT,
  account_email TEXT,
  recovery_email TEXT,
  admin_email TEXT,
  expiry_date DATE,
  auto_renew_status TEXT DEFAULT 'unknown' CHECK (auto_renew_status IN ('on', 'off', 'unknown')),
  reminder_days INTEGER DEFAULT 30,
  reminder_email TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expiring_soon', 'expired', 'suspended')),
  notes TEXT,
  is_client_visible BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  two_fa_enabled BOOLEAN DEFAULT false,
  backup_contact TEXT,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_client_access_credentials_client ON public.client_access_credentials(client_id);
CREATE INDEX idx_client_access_credentials_business ON public.client_access_credentials(business_id);
CREATE INDEX idx_client_access_credentials_expiry ON public.client_access_credentials(expiry_date);

ALTER TABLE public.client_access_credentials ENABLE ROW LEVEL SECURITY;

-- Provider staff can manage credentials for their business clients
CREATE POLICY "Staff manage client credentials"
  ON public.client_access_credentials FOR ALL TO authenticated
  USING (business_id = get_user_business_id(auth.uid()))
  WITH CHECK (business_id = get_user_business_id(auth.uid()));

-- Client users can view their own credentials (only client-visible ones)
CREATE POLICY "Client users view own credentials"
  ON public.client_access_credentials FOR SELECT TO authenticated
  USING (
    client_id = get_client_id_for_user(auth.uid())
    AND is_client_visible = true
    AND is_archived = false
  );

-- B. Client Project Integrations
CREATE TABLE public.client_project_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  integration_type TEXT NOT NULL CHECK (integration_type IN ('google_analytics', 'search_console', 'google_ads', 'facebook_ads', 'hosting_api', 'other')),
  is_enabled BOOLEAN DEFAULT false,
  provider_name TEXT,
  api_url TEXT,
  api_key_encrypted TEXT,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  account_id TEXT,
  property_id TEXT,
  measurement_id TEXT,
  business_manager_id TEXT,
  connected_account_name TEXT,
  connected_email TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('connected', 'pending', 'failed', 'disabled')),
  verification_status TEXT,
  last_sync_at TIMESTAMPTZ,
  notes TEXT,
  is_client_visible BOOLEAN DEFAULT false,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_client_project_integrations_client ON public.client_project_integrations(client_id);
CREATE INDEX idx_client_project_integrations_business ON public.client_project_integrations(business_id);

ALTER TABLE public.client_project_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage client integrations"
  ON public.client_project_integrations FOR ALL TO authenticated
  USING (business_id = get_user_business_id(auth.uid()))
  WITH CHECK (business_id = get_user_business_id(auth.uid()));

CREATE POLICY "Client users view own integrations"
  ON public.client_project_integrations FOR SELECT TO authenticated
  USING (
    client_id = get_client_id_for_user(auth.uid())
    AND is_client_visible = true
  );

-- C. Audit Logs
CREATE TABLE public.client_access_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  record_type TEXT NOT NULL CHECK (record_type IN ('credential', 'integration')),
  record_id UUID NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('create', 'update', 'delete', 'view', 'reveal_password', 'copy', 'reminder_sent', 'status_change', 'archive', 'restore')),
  action_by UUID,
  action_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_client_access_audit_client ON public.client_access_audit_logs(client_id);

ALTER TABLE public.client_access_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view audit logs"
  ON public.client_access_audit_logs FOR ALL TO authenticated
  USING (business_id = get_user_business_id(auth.uid()))
  WITH CHECK (business_id = get_user_business_id(auth.uid()));

-- D. Renewal Reminder Logs
CREATE TABLE public.renewal_reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  source_type TEXT NOT NULL CHECK (source_type IN ('hosting', 'domain', 'integration', 'other')),
  source_record_id UUID NOT NULL,
  reminder_email TEXT,
  scheduled_date DATE,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_renewal_reminder_logs_client ON public.renewal_reminder_logs(client_id);

ALTER TABLE public.renewal_reminder_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage renewal logs"
  ON public.renewal_reminder_logs FOR ALL TO authenticated
  USING (business_id = get_user_business_id(auth.uid()))
  WITH CHECK (business_id = get_user_business_id(auth.uid()));

-- Updated_at trigger for credentials
CREATE TRIGGER set_updated_at_client_access_credentials
  BEFORE UPDATE ON public.client_access_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Updated_at trigger for integrations
CREATE TRIGGER set_updated_at_client_project_integrations
  BEFORE UPDATE ON public.client_project_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
