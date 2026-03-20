
-- Tighten INSERT policies for dialer tables to check business_id
DROP POLICY IF EXISTS "Users insert call events" ON public.dialer_call_events;
CREATE POLICY "Users insert call events" ON public.dialer_call_events FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.dialer_sessions ds
  WHERE ds.id = dialer_call_events.session_id
  AND (ds.business_id = get_user_business_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role))
));

DROP POLICY IF EXISTS "Users can insert tags" ON public.dialer_call_tags;
CREATE POLICY "Users insert tags in own business" ON public.dialer_call_tags FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.dialer_sessions ds
  WHERE ds.id = dialer_call_tags.session_id
  AND (ds.business_id = get_user_business_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role))
));

DROP POLICY IF EXISTS "Users can insert their own dispositions" ON public.dialer_dispositions;
CREATE POLICY "Users insert dispositions in own business" ON public.dialer_dispositions FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.dialer_sessions ds
  WHERE ds.id = dialer_dispositions.session_id
  AND (ds.business_id = get_user_business_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role))
));

DROP POLICY IF EXISTS "Users insert own dialer sessions" ON public.dialer_sessions;
CREATE POLICY "Users insert own business dialer sessions" ON public.dialer_sessions FOR INSERT TO authenticated
WITH CHECK (business_id = get_user_business_id(auth.uid()) AND user_id = auth.uid());

DROP POLICY IF EXISTS "Users insert AI logs" ON public.dialer_ai_logs;
CREATE POLICY "Users insert AI logs in own business" ON public.dialer_ai_logs FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.dialer_sessions ds
  WHERE ds.id = dialer_ai_logs.session_id
  AND (ds.business_id = get_user_business_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role))
));
