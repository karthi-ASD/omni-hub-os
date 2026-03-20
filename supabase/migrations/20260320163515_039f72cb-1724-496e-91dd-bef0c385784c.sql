
-- Dialer call sessions table (extends existing call_logs for WebRTC dialer)
CREATE TABLE IF NOT EXISTS public.dialer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  user_id UUID NOT NULL,
  lead_id UUID REFERENCES public.leads(id),
  client_id UUID REFERENCES public.clients(id),
  phone_number TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'plivo',
  provider_call_id TEXT,
  call_status TEXT NOT NULL DEFAULT 'idle',
  call_start_time TIMESTAMPTZ,
  call_end_time TIMESTAMPTZ,
  call_duration INTEGER,
  recording_url TEXT,
  notes TEXT,
  disposition TEXT,
  ai_summary TEXT,
  ai_score NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Call events for granular event tracking
CREATE TABLE IF NOT EXISTS public.dialer_call_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.dialer_sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Agent state tracking
CREATE TABLE IF NOT EXISTS public.dialer_agent_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  user_id UUID NOT NULL,
  state TEXT NOT NULL DEFAULT 'available',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, user_id)
);

-- Indexes
CREATE INDEX idx_dialer_sessions_business ON public.dialer_sessions(business_id);
CREATE INDEX idx_dialer_sessions_user ON public.dialer_sessions(user_id);
CREATE INDEX idx_dialer_sessions_lead ON public.dialer_sessions(lead_id);
CREATE INDEX idx_dialer_sessions_status ON public.dialer_sessions(call_status);
CREATE INDEX idx_dialer_call_events_session ON public.dialer_call_events(session_id);
CREATE INDEX idx_dialer_agent_states_user ON public.dialer_agent_states(user_id);

-- RLS
ALTER TABLE public.dialer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dialer_call_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dialer_agent_states ENABLE ROW LEVEL SECURITY;

-- Policies: business-scoped access
CREATE POLICY "Users see own business dialer sessions"
  ON public.dialer_sessions FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users insert own dialer sessions"
  ON public.dialer_sessions FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Users update own dialer sessions"
  ON public.dialer_sessions FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'business_admin'));

CREATE POLICY "Users see own business call events"
  ON public.dialer_call_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.dialer_sessions ds WHERE ds.id = session_id AND (ds.business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))));

CREATE POLICY "Users insert call events"
  ON public.dialer_call_events FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.dialer_sessions ds WHERE ds.id = session_id AND ds.business_id = public.get_user_business_id(auth.uid())));

CREATE POLICY "Users see own business agent states"
  ON public.dialer_agent_states FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Enable realtime for dialer_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE public.dialer_sessions;
