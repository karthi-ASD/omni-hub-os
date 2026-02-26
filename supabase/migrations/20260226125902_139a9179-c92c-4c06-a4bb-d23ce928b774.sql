
-- Fix the overly permissive INSERT policy on notifications
DROP POLICY "Authenticated can insert notifications" ON public.notifications;

-- Replace with a scoped policy: users can only insert notifications for their own business
CREATE POLICY "Authenticated can insert tenant notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    (business_id IS NULL OR business_id = get_user_business_id(auth.uid()))
  );
