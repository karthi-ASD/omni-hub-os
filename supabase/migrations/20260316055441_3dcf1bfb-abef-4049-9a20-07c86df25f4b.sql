
-- Extend existing lead_notes table with missing columns
ALTER TABLE public.lead_notes 
  ADD COLUMN IF NOT EXISTS contact_method TEXT NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS next_followup_date DATE,
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS salesperson_id UUID;

-- Backfill salesperson_id from user_id
UPDATE public.lead_notes SET salesperson_id = user_id WHERE salesperson_id IS NULL;

-- Create client_activity_log table
CREATE TABLE IF NOT EXISTS public.client_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_source TEXT NOT NULL DEFAULT 'manual',
  description TEXT,
  created_by_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_activity_log_client_id ON public.client_activity_log(client_id);
CREATE INDEX IF NOT EXISTS idx_client_activity_log_business_id ON public.client_activity_log(business_id);

ALTER TABLE public.client_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view client activity in their business"
  ON public.client_activity_log FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Users can insert client activity in their business"
  ON public.client_activity_log FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));
