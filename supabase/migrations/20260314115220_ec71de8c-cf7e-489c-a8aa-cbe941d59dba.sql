
-- Tighten client_services RLS to use business_id scoping
DROP POLICY IF EXISTS "client_services_insert" ON public.client_services;
DROP POLICY IF EXISTS "client_services_update" ON public.client_services;
DROP POLICY IF EXISTS "client_services_delete" ON public.client_services;

CREATE POLICY "client_services_insert" ON public.client_services FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "client_services_update" ON public.client_services FOR UPDATE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "client_services_delete" ON public.client_services FOR DELETE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));
