
CREATE TABLE public.google_analytics_daily_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.seo_projects(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  users_count INTEGER DEFAULT 0,
  sessions INTEGER DEFAULT 0,
  pageviews INTEGER DEFAULT 0,
  bounce_rate NUMERIC(5,2) DEFAULT 0,
  avg_session_duration NUMERIC(10,2) DEFAULT 0,
  organic_traffic INTEGER DEFAULT 0,
  direct_traffic INTEGER DEFAULT 0,
  paid_traffic INTEGER DEFAULT 0,
  referral_traffic INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  top_pages_json JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, snapshot_date)
);

ALTER TABLE public.google_analytics_daily_stats ENABLE ROW LEVEL SECURITY;

-- Staff can manage analytics data for their business
CREATE POLICY "Staff can manage analytics stats" ON public.google_analytics_daily_stats
FOR ALL TO authenticated
USING (
  business_id = public.get_user_business_id(auth.uid())
  AND NOT public.is_client_user(auth.uid())
)
WITH CHECK (
  business_id = public.get_user_business_id(auth.uid())
  AND NOT public.is_client_user(auth.uid())
);

-- Clients can view their own analytics data
CREATE POLICY "Clients can view own analytics stats" ON public.google_analytics_daily_stats
FOR SELECT TO authenticated
USING (
  client_id = public.get_client_id_for_user(auth.uid())
);
