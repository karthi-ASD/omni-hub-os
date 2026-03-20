
-- ============================================
-- Activity Intelligence Calendar Tables
-- ============================================

-- 1. activity_logs - tracks all meaningful user/business/system actions
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_role TEXT,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id UUID,
  module TEXT NOT NULL DEFAULT 'system',
  action_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  device_info TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. user_behaviour_logs - page visits, navigation, time spent, important clicks
CREATE TABLE IF NOT EXISTS public.user_behaviour_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_role TEXT,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id UUID,
  session_id TEXT,
  page_url TEXT,
  page_name TEXT,
  action TEXT DEFAULT 'page_visit',
  element TEXT,
  time_spent INT DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. user_sessions - login sessions and duration
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  session_id TEXT NOT NULL,
  login_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  logout_time TIMESTAMPTZ,
  total_duration INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_business_id ON public.activity_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_client_id ON public.activity_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_module ON public.activity_logs(module);

CREATE INDEX IF NOT EXISTS idx_behaviour_logs_user_id ON public.user_behaviour_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_behaviour_logs_business_id ON public.user_behaviour_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_behaviour_logs_session_id ON public.user_behaviour_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_behaviour_logs_created_at ON public.user_behaviour_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON public.user_sessions(session_id);

-- RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_behaviour_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- activity_logs policies
CREATE POLICY "Super admins see all activity_logs"
  ON public.activity_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Business admins see own business activity_logs"
  ON public.activity_logs FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'business_admin')
    AND business_id = public.get_user_business_id(auth.uid())
  );

CREATE POLICY "Users see own activity_logs"
  ON public.activity_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can insert activity_logs"
  ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- user_behaviour_logs policies
CREATE POLICY "Super admins see all behaviour_logs"
  ON public.user_behaviour_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Business admins see own business behaviour_logs"
  ON public.user_behaviour_logs FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'business_admin')
    AND business_id = public.get_user_business_id(auth.uid())
  );

CREATE POLICY "Users see own behaviour_logs"
  ON public.user_behaviour_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can insert behaviour_logs"
  ON public.user_behaviour_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- user_sessions policies
CREATE POLICY "Super admins see all sessions"
  ON public.user_sessions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Business admins see sessions via profile"
  ON public.user_sessions FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'business_admin')
    AND user_id IN (
      SELECT p.user_id FROM public.profiles p
      WHERE p.business_id = public.get_user_business_id(auth.uid())
    )
  );

CREATE POLICY "Users see own sessions"
  ON public.user_sessions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can insert sessions"
  ON public.user_sessions FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own sessions"
  ON public.user_sessions FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
