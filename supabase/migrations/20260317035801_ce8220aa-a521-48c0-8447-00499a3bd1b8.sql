-- Fix overly permissive INSERT policies on deals and leads
DROP POLICY IF EXISTS "Authenticated can insert deals in tenant" ON public.deals;
CREATE POLICY "Authenticated can insert deals in tenant"
ON public.deals FOR INSERT
TO authenticated
WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

DROP POLICY IF EXISTS "Employees can create leads for their business" ON public.leads;
CREATE POLICY "Employees can create leads for their business"
ON public.leads FOR INSERT
TO authenticated
WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

-- Fix client RLS policies to use get_client_id_for_user() instead of c.user_id = auth.uid()

DROP POLICY IF EXISTS "Clients view own SEO campaigns" ON public.seo_campaigns;
CREATE POLICY "Client users view own SEO campaigns"
ON public.seo_campaigns FOR SELECT
TO authenticated
USING (client_id = public.get_client_id_for_user(auth.uid()));

DROP POLICY IF EXISTS "Clients view own SEO keywords" ON public.seo_keywords;
DROP POLICY IF EXISTS "Clients view own keywords" ON public.seo_keywords;
CREATE POLICY "Client users view own SEO keywords"
ON public.seo_keywords FOR SELECT
TO authenticated
USING (
  campaign_id IN (
    SELECT sc.id FROM public.seo_campaigns sc
    WHERE sc.client_id = public.get_client_id_for_user(auth.uid())
  )
);

DROP POLICY IF EXISTS "Clients view own monthly reports" ON public.seo_monthly_reports;
CREATE POLICY "Client users view own monthly reports"
ON public.seo_monthly_reports FOR SELECT
TO authenticated
USING (client_id = public.get_client_id_for_user(auth.uid()));

DROP POLICY IF EXISTS "Clients view own SEO reports" ON public.seo_reports;
CREATE POLICY "Client users view own SEO reports"
ON public.seo_reports FOR SELECT
TO authenticated
USING (
  campaign_id IN (
    SELECT sc.id FROM public.seo_campaigns sc
    WHERE sc.client_id = public.get_client_id_for_user(auth.uid())
  )
);

DROP POLICY IF EXISTS "Clients view own analytics metrics" ON public.analytics_daily_metrics;

DROP POLICY IF EXISTS "Client users view own SEO tasks" ON public.seo_tasks;
CREATE POLICY "Client users view own SEO tasks"
ON public.seo_tasks FOR SELECT
TO authenticated
USING (client_id = public.get_client_id_for_user(auth.uid()));

DROP POLICY IF EXISTS "Client users view own tickets" ON public.support_tickets;
CREATE POLICY "Client users view own tickets"
ON public.support_tickets FOR SELECT
TO authenticated
USING (client_id = public.get_client_id_for_user(auth.uid()));