
-- Add conversion_requested to lead_stage enum
ALTER TYPE public.lead_stage ADD VALUE IF NOT EXISTS 'conversion_requested' BEFORE 'won';

-- Create lead_conversion_requests table
CREATE TABLE public.lead_conversion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  requested_by_user_id UUID NOT NULL,
  request_status TEXT NOT NULL DEFAULT 'pending' CHECK (request_status IN ('pending', 'approved', 'rejected')),
  accounts_user_id UUID,
  decision_notes TEXT,
  services TEXT,
  contract_value NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.lead_conversion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view conversion requests for their business"
  ON public.lead_conversion_requests FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Users can insert conversion requests for their business"
  ON public.lead_conversion_requests FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Users can update conversion requests for their business"
  ON public.lead_conversion_requests FOR UPDATE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

-- Add lead_id column to clients if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'lead_id') THEN
    ALTER TABLE public.clients ADD COLUMN lead_id UUID REFERENCES public.leads(id);
  END IF;
END $$;

-- Index
CREATE INDEX IF NOT EXISTS idx_lead_conversion_requests_business ON public.lead_conversion_requests(business_id);
CREATE INDEX IF NOT EXISTS idx_lead_conversion_requests_status ON public.lead_conversion_requests(request_status);
CREATE INDEX IF NOT EXISTS idx_lead_conversion_requests_lead ON public.lead_conversion_requests(lead_id);
