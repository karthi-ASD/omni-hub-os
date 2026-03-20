-- Add client-scoped RLS policies for activity intelligence tables
-- Clients can see activity logs scoped to their client_id

CREATE POLICY "Client users see own client activity_logs"
  ON public.activity_logs FOR SELECT TO authenticated
  USING (
    client_id IS NOT NULL
    AND client_id = public.get_client_id_for_user(auth.uid())
  );

CREATE POLICY "Client users see own client behaviour_logs"
  ON public.user_behaviour_logs FOR SELECT TO authenticated
  USING (
    client_id IS NOT NULL
    AND client_id = public.get_client_id_for_user(auth.uid())
  );

CREATE POLICY "Client users see own client sessions"
  ON public.user_sessions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.client_users cu
      WHERE cu.user_id = auth.uid()
        AND cu.is_primary = true
    )
    AND user_id = auth.uid()
  );