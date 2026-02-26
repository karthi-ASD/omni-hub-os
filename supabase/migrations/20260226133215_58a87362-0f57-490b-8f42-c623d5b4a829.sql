
-- =====================================================
-- STAGE 4: Deals, Call Logs, Deal Notes, Deal Stage History
-- =====================================================

-- Deal stage enum
CREATE TYPE public.deal_stage AS ENUM (
  'new', 'contacted', 'meeting_booked', 'needs_analysis',
  'proposal_requested', 'negotiation', 'won', 'lost'
);

-- Deal status enum
CREATE TYPE public.deal_status AS ENUM ('open', 'won', 'lost', 'archived');

-- Call type enum
CREATE TYPE public.call_type AS ENUM ('outbound', 'inbound');

-- Call outcome enum
CREATE TYPE public.call_outcome AS ENUM (
  'no_answer', 'left_voicemail', 'spoke', 'follow_up_required', 'not_interested', 'qualified'
);

-- =====================================================
-- DEALS TABLE
-- =====================================================
CREATE TABLE public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  deal_name TEXT NOT NULL,
  lead_id UUID REFERENCES public.leads(id),
  inquiry_id UUID REFERENCES public.inquiries(id),
  contact_name TEXT NOT NULL,
  business_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  service_interest TEXT,
  estimated_value NUMERIC,
  currency TEXT NOT NULL DEFAULT 'AUD',
  expected_close_date DATE,
  owner_user_id UUID,
  stage deal_stage NOT NULL DEFAULT 'new',
  status deal_status NOT NULL DEFAULT 'open',
  lost_reason TEXT,
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_deals_business_id ON public.deals(business_id);
CREATE INDEX idx_deals_stage ON public.deals(stage);
CREATE INDEX idx_deals_owner ON public.deals(owner_user_id);
CREATE INDEX idx_deals_status ON public.deals(status);

-- RLS Policies for deals
CREATE POLICY "Super admins can manage all deals" ON public.deals FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Business admins can manage tenant deals" ON public.deals FOR ALL
  USING (has_role(auth.uid(), 'business_admin') AND business_id = get_user_business_id(auth.uid()));

CREATE POLICY "Managers can manage tenant deals" ON public.deals FOR ALL
  USING (has_role(auth.uid(), 'manager') AND business_id = get_user_business_id(auth.uid()));

CREATE POLICY "Employees can view assigned deals" ON public.deals FOR SELECT
  USING (has_role(auth.uid(), 'employee') AND owner_user_id = auth.uid());

CREATE POLICY "Employees can update assigned deals" ON public.deals FOR UPDATE
  USING (has_role(auth.uid(), 'employee') AND owner_user_id = auth.uid());

CREATE POLICY "Authenticated can insert deals in tenant" ON public.deals FOR INSERT
  WITH CHECK (business_id = get_user_business_id(auth.uid()));

-- =====================================================
-- DEAL STAGE HISTORY
-- =====================================================
CREATE TABLE public.deal_stage_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  from_stage deal_stage,
  to_stage deal_stage NOT NULL,
  changed_by_user_id UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.deal_stage_history ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_deal_stage_history_deal ON public.deal_stage_history(deal_id);

CREATE POLICY "Super admins can manage all deal stage history" ON public.deal_stage_history FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Business users can manage tenant deal history" ON public.deal_stage_history FOR ALL
  USING (business_id = get_user_business_id(auth.uid()));

-- =====================================================
-- DEAL NOTES
-- =====================================================
CREATE TABLE public.deal_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  author_user_id UUID NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.deal_notes ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_deal_notes_deal ON public.deal_notes(deal_id);

CREATE POLICY "Super admins can manage all deal notes" ON public.deal_notes FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Business users can manage tenant deal notes" ON public.deal_notes FOR ALL
  USING (business_id = get_user_business_id(auth.uid()));

-- =====================================================
-- CALL LOGS
-- =====================================================
CREATE TABLE public.call_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  related_entity_type TEXT NOT NULL,
  related_entity_id UUID NOT NULL,
  caller_user_id UUID NOT NULL,
  call_type call_type NOT NULL DEFAULT 'outbound',
  outcome call_outcome NOT NULL,
  duration_seconds INTEGER,
  notes TEXT,
  call_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_call_logs_business ON public.call_logs(business_id);
CREATE INDEX idx_call_logs_entity ON public.call_logs(related_entity_type, related_entity_id);

CREATE POLICY "Super admins can manage all call logs" ON public.call_logs FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Business admins can manage tenant call logs" ON public.call_logs FOR ALL
  USING (has_role(auth.uid(), 'business_admin') AND business_id = get_user_business_id(auth.uid()));

CREATE POLICY "Managers can manage tenant call logs" ON public.call_logs FOR ALL
  USING (has_role(auth.uid(), 'manager') AND business_id = get_user_business_id(auth.uid()));

CREATE POLICY "Employees can manage own call logs" ON public.call_logs FOR ALL
  USING (caller_user_id = auth.uid());

CREATE POLICY "Authenticated can insert call logs in tenant" ON public.call_logs FOR INSERT
  WITH CHECK (business_id = get_user_business_id(auth.uid()));

-- =====================================================
-- ENABLE REALTIME
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.deals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_logs;
