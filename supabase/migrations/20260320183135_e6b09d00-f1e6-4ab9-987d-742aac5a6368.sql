
-- system_logs table for error observability
CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'error',
  message TEXT NOT NULL,
  metadata JSONB,
  business_id UUID REFERENCES public.businesses(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view system logs for their business"
ON public.system_logs FOR SELECT TO authenticated
USING (
  business_id IN (
    SELECT business_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Service role can insert system logs"
ON public.system_logs FOR INSERT
WITH CHECK (true);

-- Missing performance indexes
CREATE INDEX IF NOT EXISTS idx_dialer_sessions_created_at ON public.dialer_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_dialer_call_tags_session ON public.dialer_call_tags(session_id);
CREATE INDEX IF NOT EXISTS idx_dialer_ai_logs_session ON public.dialer_ai_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_dialer_dispositions_session ON public.dialer_dispositions(session_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_business ON public.system_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_type ON public.system_logs(type);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs(created_at DESC);
