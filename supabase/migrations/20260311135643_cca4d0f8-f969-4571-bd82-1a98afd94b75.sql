
-- Allow clients to read their own monthly reports
CREATE POLICY "Clients view own monthly reports"
ON public.seo_monthly_reports
FOR SELECT
TO authenticated
USING (
  client_id IN (
    SELECT c.id FROM public.clients c WHERE c.user_id = auth.uid()
  )
);

-- Allow clients to read analytics for their business
CREATE POLICY "Clients view own analytics metrics"
ON public.analytics_daily_metrics
FOR SELECT
TO authenticated
USING (
  business_id IN (
    SELECT c.business_id FROM public.clients c WHERE c.user_id = auth.uid()
  )
);

-- Allow clients to read their own seo_keywords via campaign
CREATE POLICY "Clients view own keywords"
ON public.seo_keywords
FOR SELECT
TO authenticated
USING (
  campaign_id IN (
    SELECT sc.id FROM public.seo_campaigns sc
    JOIN public.clients c ON c.id = sc.client_id
    WHERE c.user_id = auth.uid()
  )
);
