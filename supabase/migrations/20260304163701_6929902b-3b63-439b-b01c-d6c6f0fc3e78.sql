
-- =====================================================
-- STAGE 21: AI Growth Engine Foundation
-- =====================================================

-- 1) ai_agent_versions (prompt version control)
CREATE TABLE public.ai_agent_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.ai_agents(id) ON DELETE CASCADE NOT NULL,
  version_number INT NOT NULL DEFAULT 1,
  system_prompt TEXT,
  tools_allowed JSONB DEFAULT '{}',
  data_capture_schema JSONB DEFAULT '{}',
  safety_rules TEXT,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.ai_agent_versions ENABLE ROW LEVEL SECURITY;

-- 2) ai_agent_assignments
CREATE TABLE public.ai_agent_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES public.ai_agents(id) ON DELETE CASCADE NOT NULL,
  scope_type TEXT NOT NULL DEFAULT 'ALL',
  assigned_team_id UUID,
  assigned_user_id UUID,
  triggers_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.ai_agent_assignments ENABLE ROW LEVEL SECURITY;

-- 3) provider_connections
CREATE TABLE public.provider_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  provider_type TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DISCONNECTED',
  display_label TEXT,
  last_tested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.provider_connections ENABLE ROW LEVEL SECURITY;

-- 4) provider_credentials_vault
CREATE TABLE public.provider_credentials_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  provider_connection_id UUID REFERENCES public.provider_connections(id) ON DELETE CASCADE NOT NULL,
  key_name TEXT NOT NULL,
  encrypted_value TEXT NOT NULL,
  masked_value TEXT,
  rotation_due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.provider_credentials_vault ENABLE ROW LEVEL SECURITY;

-- 5) provider_access_logs
CREATE TABLE public.provider_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  provider_connection_id UUID REFERENCES public.provider_connections(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  performed_by UUID NOT NULL,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.provider_access_logs ENABLE ROW LEVEL SECURITY;

-- 6) conversation_threads
CREATE TABLE public.conversation_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  thread_type TEXT NOT NULL DEFAULT 'GENERAL',
  lead_id UUID,
  client_id UUID,
  job_id UUID,
  ticket_id UUID,
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN',
  assigned_to UUID,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.conversation_threads ENABLE ROW LEVEL SECURITY;

-- 7) conversation_participants
CREATE TABLE public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  thread_id UUID REFERENCES public.conversation_threads(id) ON DELETE CASCADE NOT NULL,
  participant_type TEXT NOT NULL DEFAULT 'EMPLOYEE',
  participant_id UUID,
  display_name TEXT,
  email TEXT,
  phone TEXT,
  whatsapp_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- 8) conversation_messages
CREATE TABLE public.conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  thread_id UUID REFERENCES public.conversation_threads(id) ON DELETE CASCADE NOT NULL,
  direction TEXT NOT NULL DEFAULT 'OUTBOUND',
  channel TEXT NOT NULL DEFAULT 'EMAIL',
  provider_message_id TEXT,
  from_address TEXT,
  to_address TEXT,
  body_text TEXT,
  body_html TEXT,
  media_urls JSONB,
  status TEXT NOT NULL DEFAULT 'QUEUED',
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

-- 9) consent_records
CREATE TABLE public.consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  person_type TEXT NOT NULL DEFAULT 'LEAD',
  person_id UUID,
  phone TEXT,
  email TEXT,
  consent_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'GRANTED',
  source TEXT NOT NULL DEFAULT 'FORM',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;

-- 10) opt_out_registry
CREATE TABLE public.opt_out_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  channel TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  reason TEXT NOT NULL DEFAULT 'STOP',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.opt_out_registry ENABLE ROW LEVEL SECURITY;

-- 11) webhook_endpoints
CREATE TABLE public.webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  endpoint_type TEXT NOT NULL DEFAULT 'FORM_LEAD',
  api_key_hash TEXT,
  signature_secret_encrypted TEXT,
  is_active BOOLEAN DEFAULT true,
  rate_limit_per_minute INT DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;

-- 12) webhook_events
CREATE TABLE public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  endpoint_id UUID REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE NOT NULL,
  external_event_id TEXT UNIQUE,
  event_type TEXT,
  payload_json JSONB,
  received_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'RECEIVED',
  error_message TEXT
);
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- ai_agent_versions
CREATE POLICY "sa_all_agent_versions" ON public.ai_agent_versions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "tenant_agent_versions" ON public.ai_agent_versions FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

-- ai_agent_assignments
CREATE POLICY "sa_all_agent_assignments" ON public.ai_agent_assignments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "tenant_agent_assignments" ON public.ai_agent_assignments FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

-- provider_connections
CREATE POLICY "sa_all_provider_connections" ON public.provider_connections FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "tenant_provider_connections" ON public.provider_connections FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

-- provider_credentials_vault (admin only)
CREATE POLICY "sa_all_creds" ON public.provider_credentials_vault FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "ba_own_creds" ON public.provider_credentials_vault FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) AND (public.has_role(auth.uid(), 'business_admin')));

-- provider_access_logs
CREATE POLICY "sa_all_provider_logs" ON public.provider_access_logs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "tenant_provider_logs" ON public.provider_access_logs FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

-- conversation_threads
CREATE POLICY "sa_all_threads" ON public.conversation_threads FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "tenant_threads" ON public.conversation_threads FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

-- conversation_participants
CREATE POLICY "sa_all_participants" ON public.conversation_participants FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "tenant_participants" ON public.conversation_participants FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

-- conversation_messages
CREATE POLICY "sa_all_messages" ON public.conversation_messages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "tenant_messages" ON public.conversation_messages FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

-- consent_records
CREATE POLICY "sa_all_consent" ON public.consent_records FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "tenant_consent" ON public.consent_records FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

-- opt_out_registry
CREATE POLICY "sa_all_optout" ON public.opt_out_registry FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "tenant_optout" ON public.opt_out_registry FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

-- webhook_endpoints
CREATE POLICY "sa_all_webhooks" ON public.webhook_endpoints FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "tenant_webhooks" ON public.webhook_endpoints FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

-- webhook_events
CREATE POLICY "sa_all_webhook_events" ON public.webhook_events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "tenant_webhook_events" ON public.webhook_events FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

-- Enable realtime for conversation_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_messages;
