-- Create agent_caller_ids table
CREATE TABLE IF NOT EXISTS public.agent_caller_ids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  agent_user_id UUID NOT NULL,
  agent_email TEXT NOT NULL,
  plivo_number TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  is_default BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_caller_ids_user ON public.agent_caller_ids(agent_user_id);
CREATE INDEX idx_agent_caller_ids_business ON public.agent_caller_ids(business_id);

ALTER TABLE public.agent_caller_ids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view caller IDs in their business"
ON public.agent_caller_ids FOR SELECT TO authenticated
USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage caller IDs"
ON public.agent_caller_ids FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin')
  OR public.has_role(auth.uid(), 'business_admin')
);

-- Add caller_id_used columns
ALTER TABLE public.crm_call_communications
  ADD COLUMN IF NOT EXISTS caller_id_used TEXT;

ALTER TABLE public.dialer_sessions
  ADD COLUMN IF NOT EXISTS caller_id_used TEXT;