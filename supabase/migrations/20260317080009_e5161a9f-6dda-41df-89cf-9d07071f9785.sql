-- Google Maps Daily Stats table
CREATE TABLE IF NOT EXISTS public.google_maps_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.seo_projects(id),
  client_id UUID REFERENCES public.clients(id),
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  views_total INTEGER NOT NULL DEFAULT 0,
  views_search INTEGER NOT NULL DEFAULT 0,
  views_maps INTEGER NOT NULL DEFAULT 0,
  website_clicks INTEGER NOT NULL DEFAULT 0,
  direction_requests INTEGER NOT NULL DEFAULT 0,
  phone_calls INTEGER NOT NULL DEFAULT 0,
  messages INTEGER NOT NULL DEFAULT 0,
  reviews_count INTEGER NOT NULL DEFAULT 0,
  average_rating NUMERIC(2,1) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_gmaps_stats_project_date ON public.google_maps_daily_stats(project_id, snapshot_date);

ALTER TABLE public.google_maps_daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gmaps_stats_tenant" ON public.google_maps_daily_stats
  FOR ALL TO authenticated
  USING (
    business_id = public.get_user_business_id(auth.uid())
    OR public.has_role(auth.uid(), 'super_admin')
    OR client_id IN (SELECT client_id FROM public.client_users WHERE user_id = auth.uid())
  )
  WITH CHECK (
    business_id = public.get_user_business_id(auth.uid())
    OR public.has_role(auth.uid(), 'super_admin')
  );

-- Add location_id column to analytics_connections for GBP
ALTER TABLE public.analytics_connections
  ADD COLUMN IF NOT EXISTS location_id TEXT,
  ADD COLUMN IF NOT EXISTS business_name TEXT;