
-- Add client_id to call_logs for client portal visibility
ALTER TABLE public.call_logs ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_call_logs_client_id ON public.call_logs(client_id);

-- RLS policy: client users can view their own call logs
CREATE POLICY "Client users view own call logs"
ON public.call_logs
FOR SELECT
TO authenticated
USING (
  client_id IS NOT NULL AND client_id = get_client_id_for_user(auth.uid())
);
