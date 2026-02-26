
-- Fix overly permissive INSERT policies

-- Drop the permissive policies
DROP POLICY "Authenticated users can insert audit logs" ON public.audit_logs;
DROP POLICY "Authenticated users can insert events" ON public.system_events;

-- Recreate with proper checks: actor must be the current user
CREATE POLICY "Authenticated users can insert own audit logs"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (actor_user_id = auth.uid());

-- System events: user can insert events for their own business or null business
CREATE POLICY "Authenticated users can insert own events"
  ON public.system_events FOR INSERT TO authenticated
  WITH CHECK (
    business_id IS NULL 
    OR business_id = public.get_user_business_id(auth.uid())
  );
