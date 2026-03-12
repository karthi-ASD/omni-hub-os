
-- SEO Competitor fetch logs table
CREATE TABLE IF NOT EXISTS public.seo_competitor_fetch_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) NOT NULL,
  seo_project_id UUID NOT NULL,
  fetch_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  results_count INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_competitor_fetch_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business fetch logs"
  ON public.seo_competitor_fetch_logs FOR SELECT TO authenticated
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own business fetch logs"
  ON public.seo_competitor_fetch_logs FOR INSERT TO authenticated
  WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- Add competitor_title and ranking_position to seo_competitors if not present
ALTER TABLE public.seo_competitors ADD COLUMN IF NOT EXISTS competitor_title TEXT;
ALTER TABLE public.seo_competitors ADD COLUMN IF NOT EXISTS ranking_position INT;
ALTER TABLE public.seo_competitors ADD COLUMN IF NOT EXISTS discovered_date TIMESTAMPTZ DEFAULT now();
