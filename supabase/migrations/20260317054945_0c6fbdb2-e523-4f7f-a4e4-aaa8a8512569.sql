-- 1. Client users can view their own invoices
CREATE POLICY "Client users view own invoices"
ON public.xero_invoices
FOR SELECT
TO authenticated
USING (client_id = get_client_id_for_user(auth.uid()));

-- 2. Client users can view their own payments
CREATE POLICY "Client users view own payments"
ON public.xero_payments
FOR SELECT
TO authenticated
USING (client_id = get_client_id_for_user(auth.uid()));

-- 3. Fix seo_keywords: add policy using seo_project_id -> seo_projects.client_id
DROP POLICY IF EXISTS "Client users view own SEO keywords" ON public.seo_keywords;

CREATE POLICY "Client users view own SEO keywords"
ON public.seo_keywords
FOR SELECT
TO authenticated
USING (
  seo_project_id IN (
    SELECT id FROM public.seo_projects
    WHERE client_id = get_client_id_for_user(auth.uid())
  )
);

-- 4. Client users can view their own competitors
CREATE POLICY "Client users view own competitors"
ON public.seo_competitors
FOR SELECT
TO authenticated
USING (client_id = get_client_id_for_user(auth.uid()));

-- 5. Client users can view their own billing schedules
CREATE POLICY "Client users view own billing schedules"
ON public.client_billing_schedules
FOR SELECT
TO authenticated
USING (client_id = get_client_id_for_user(auth.uid()));

-- 6. Client users can view their own websites
CREATE POLICY "Client users view own websites"
ON public.client_websites
FOR SELECT
TO authenticated
USING (client_id = get_client_id_for_user(auth.uid()));

-- 7. Client users can view their own services
CREATE POLICY "Client users view own services"
ON public.client_services
FOR SELECT
TO authenticated
USING (client_id = get_client_id_for_user(auth.uid()));

-- 8. Fix support_tickets INSERT: allow client users to create tickets for their provider
DROP POLICY IF EXISTS "Users can create tickets in their business" ON public.support_tickets;

CREATE POLICY "Users can create tickets in their business"
ON public.support_tickets
FOR INSERT
TO authenticated
WITH CHECK (
  (business_id = get_user_business_id(auth.uid()))
  OR has_role(auth.uid(), 'super_admin')
  OR is_client_user(auth.uid())
);