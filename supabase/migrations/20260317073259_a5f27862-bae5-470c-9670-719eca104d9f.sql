
-- Analytics sync status tracking table
CREATE TABLE public.analytics_sync_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.seo_projects(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'google_analytics',
  last_sync_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, project_id, source)
);

ALTER TABLE public.analytics_sync_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage sync status" ON public.analytics_sync_status
FOR ALL TO authenticated
USING (
  business_id = public.get_user_business_id(auth.uid())
  AND NOT public.is_client_user(auth.uid())
)
WITH CHECK (
  business_id = public.get_user_business_id(auth.uid())
  AND NOT public.is_client_user(auth.uid())
);

CREATE POLICY "Clients can view own sync status" ON public.analytics_sync_status
FOR SELECT TO authenticated
USING (
  client_id = public.get_client_id_for_user(auth.uid())
);

-- Also add client_id to the unique constraint for google_analytics_daily_stats
-- to support both project-based and client-based lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_ga_stats_client_date 
ON public.google_analytics_daily_stats (client_id, snapshot_date)
WHERE client_id IS NOT NULL;
