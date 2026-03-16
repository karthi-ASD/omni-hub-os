
-- Proposal requests table
CREATE TABLE IF NOT EXISTS public.proposal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  requested_by_sales_id UUID NOT NULL,
  client_name TEXT NOT NULL,
  service_details TEXT,
  budget_range TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_proposal_requests_biz ON public.proposal_requests(business_id);
CREATE INDEX idx_proposal_requests_lead ON public.proposal_requests(lead_id);

ALTER TABLE public.proposal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON public.proposal_requests
  FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

-- Proposals table with versioning
CREATE TABLE IF NOT EXISTS public.deal_room_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  proposal_request_id UUID REFERENCES public.proposal_requests(id) ON DELETE SET NULL,
  proposal_title TEXT NOT NULL,
  proposal_version INT NOT NULL DEFAULT 1,
  uploaded_by_user_id UUID,
  pdf_file_path TEXT,
  expiry_date DATE,
  proposal_status TEXT NOT NULL DEFAULT 'draft' CHECK (proposal_status IN ('draft','sent','viewed','reopened','negotiation','accepted','rejected','expired')),
  is_latest BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_deal_room_proposals_biz ON public.deal_room_proposals(business_id);
CREATE INDEX idx_deal_room_proposals_lead ON public.deal_room_proposals(lead_id);
CREATE INDEX idx_deal_room_proposals_client ON public.deal_room_proposals(client_id);

ALTER TABLE public.deal_room_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON public.deal_room_proposals
  FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

-- Proposal activity / engagement tracking
CREATE TABLE IF NOT EXISTS public.proposal_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  proposal_id UUID NOT NULL REFERENCES public.deal_room_proposals(id) ON DELETE CASCADE,
  customer_user_id UUID,
  activity_type TEXT NOT NULL,
  section_viewed TEXT,
  duration_seconds INT DEFAULT 0,
  device_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_proposal_activity_proposal ON public.proposal_activity(proposal_id);
CREATE INDEX idx_proposal_activity_biz ON public.proposal_activity(business_id);

ALTER TABLE public.proposal_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON public.proposal_activity
  FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

-- Storage bucket for proposal PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('proposal-files', 'proposal-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: authenticated users can upload/read from their business context
CREATE POLICY "Authenticated users can upload proposals"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'proposal-files');

CREATE POLICY "Authenticated users can view proposals"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'proposal-files');
