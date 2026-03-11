
-- Add client_id column to notifications table for client-targeted notifications
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE;

-- Create index for client notifications lookup
CREATE INDEX IF NOT EXISTS idx_notifications_client_id ON public.notifications(client_id) WHERE client_id IS NOT NULL;

-- RLS policy: clients can read their own notifications
CREATE POLICY "Clients can read own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (
  client_id IS NOT NULL
  AND client_id IN (
    SELECT c.id FROM public.clients c
    JOIN public.profiles p ON p.business_id = c.business_id
    WHERE p.user_id = auth.uid()
  )
  OR user_id = auth.uid()
);

-- RLS policy: clients can update (mark read) their own notifications
CREATE POLICY "Clients can update own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (
  client_id IS NOT NULL
  AND client_id IN (
    SELECT c.id FROM public.clients c
    JOIN public.profiles p ON p.business_id = c.business_id
    WHERE p.user_id = auth.uid()
  )
  OR user_id = auth.uid()
)
WITH CHECK (
  client_id IS NOT NULL
  AND client_id IN (
    SELECT c.id FROM public.clients c
    JOIN public.profiles p ON p.business_id = c.business_id
    WHERE p.user_id = auth.uid()
  )
  OR user_id = auth.uid()
);
