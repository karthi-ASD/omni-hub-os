
-- =====================================================
-- STAGE 22: Voice Agent (Plivo) Tables
-- =====================================================

-- 1) voice_agent_policies
CREATE TABLE public.voice_agent_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  trigger_type TEXT NOT NULL DEFAULT 'FORM_LEAD',
  call_window_start TIME DEFAULT '09:00',
  call_window_end TIME DEFAULT '18:00',
  call_timezone TEXT DEFAULT 'Australia/Sydney',
  max_attempts INT DEFAULT 3,
  retry_minutes INT DEFAULT 15,
  require_consent BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.voice_agent_policies ENABLE ROW LEVEL SECURITY;

-- 2) voice_agent_scripts
CREATE TABLE public.voice_agent_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  script_json JSONB NOT NULL DEFAULT '{
    "intro": "Hi, this is the AI assistant calling on behalf of {business_name}, powered by Nextweb.",
    "consent": "This call may be recorded for quality assurance. Do you consent to continue?",
    "verify": "Am I speaking with {lead_name}?",
    "confirm_service": "You mentioned you are interested in {service}. Is that correct?",
    "qualification": [
      "What are you trying to achieve with this project?",
      "Is this a new project or an improvement to an existing one?",
      "Do you have a timeframe in mind?",
      "Do you have a budget range?"
    ],
    "booking": "Our team would like to speak with you in more detail. What day and time works best for you?",
    "timezone": "Which city or timezone are you located in?",
    "closing": "Great, I have scheduled your call. You will receive a confirmation email shortly. Thank you for contacting {business_name}."
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.voice_agent_scripts ENABLE ROW LEVEL SECURITY;

-- 3) voice_agent_sessions
CREATE TABLE public.voice_agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID,
  inquiry_id UUID,
  thread_id UUID REFERENCES public.conversation_threads(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES public.ai_agents(id) ON DELETE SET NULL,
  agent_version_id UUID REFERENCES public.ai_agent_versions(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'QUEUED',
  plivo_call_uuid TEXT,
  attempt_number INT DEFAULT 1,
  scheduled_call_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  call_duration_seconds INT,
  recording_url TEXT,
  transcript_text TEXT,
  extracted_json JSONB,
  ai_summary TEXT,
  followup_calendar_event_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.voice_agent_sessions ENABLE ROW LEVEL SECURITY;

-- 4) voice_agent_events
CREATE TABLE public.voice_agent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.voice_agent_sessions(id) ON DELETE CASCADE NOT NULL,
  event_source TEXT NOT NULL DEFAULT 'INTERNAL',
  event_type TEXT NOT NULL,
  payload_json JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.voice_agent_events ENABLE ROW LEVEL SECURITY;

-- 5) voice_agent_extractions
CREATE TABLE public.voice_agent_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.voice_agent_sessions(id) ON DELETE CASCADE NOT NULL,
  lead_name TEXT,
  phone TEXT,
  email TEXT,
  business_name TEXT,
  service_interest TEXT,
  requirement_summary TEXT,
  timeframe_start TEXT,
  timeframe_end TEXT,
  budget_range TEXT,
  confirmed_followup_date TEXT,
  confirmed_followup_time TEXT,
  timezone TEXT,
  call_summary TEXT,
  call_outcome TEXT DEFAULT 'PENDING',
  consent_confirmed BOOLEAN DEFAULT false,
  next_action TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.voice_agent_extractions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- voice_agent_policies
CREATE POLICY "sa_all_va_policies" ON public.voice_agent_policies FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "tenant_va_policies" ON public.voice_agent_policies FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

-- voice_agent_scripts
CREATE POLICY "sa_all_va_scripts" ON public.voice_agent_scripts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "tenant_va_scripts" ON public.voice_agent_scripts FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR business_id IS NULL);

-- voice_agent_sessions
CREATE POLICY "sa_all_va_sessions" ON public.voice_agent_sessions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "tenant_va_sessions" ON public.voice_agent_sessions FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

-- voice_agent_events
CREATE POLICY "sa_all_va_events" ON public.voice_agent_events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "tenant_va_events" ON public.voice_agent_events FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

-- voice_agent_extractions
CREATE POLICY "sa_all_va_extractions" ON public.voice_agent_extractions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "tenant_va_extractions" ON public.voice_agent_extractions FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

-- Enable realtime for sessions
ALTER PUBLICATION supabase_realtime ADD TABLE public.voice_agent_sessions;
