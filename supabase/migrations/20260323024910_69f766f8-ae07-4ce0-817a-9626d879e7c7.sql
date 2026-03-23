-- Create crm_call_communications table
CREATE TABLE IF NOT EXISTS public.crm_call_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  user_id UUID NOT NULL,
  phone_number_raw TEXT NOT NULL,
  phone_number_normalized TEXT NOT NULL,
  dialer_session_id UUID,
  entity_type TEXT,
  entity_id UUID,
  lead_id UUID,
  contact_id UUID,
  client_id UUID,
  account_id UUID,
  project_id UUID,
  source_type TEXT NOT NULL DEFAULT 'manual_dial',
  call_direction TEXT NOT NULL DEFAULT 'outbound',
  call_status TEXT NOT NULL DEFAULT 'initiated',
  disposition TEXT,
  disposition_subtype TEXT,
  disposition_notes TEXT,
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  answer_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  talk_time_seconds INTEGER NOT NULL DEFAULT 0,
  connected BOOLEAN NOT NULL DEFAULT false,
  recording_url TEXT,
  transcript_status TEXT NOT NULL DEFAULT 'pending',
  transcript_text TEXT,
  ai_synopsis_internal TEXT,
  ai_synopsis_customer_safe TEXT,
  ai_score INTEGER,
  sentiment TEXT,
  callback_required BOOLEAN NOT NULL DEFAULT false,
  callback_datetime TIMESTAMPTZ,
  callback_reason TEXT,
  callback_status TEXT,
  conversion_status TEXT,
  matched_name TEXT,
  matched_business_name TEXT,
  entity_name_snapshot TEXT,
  entity_type_snapshot TEXT,
  entity_id_snapshot UUID,
  customer_visibility_level TEXT NOT NULL DEFAULT 'none',
  customer_safe_summary TEXT,
  visible_to_customer BOOLEAN NOT NULL DEFAULT false,
  auto_tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_comm_business_id ON public.crm_call_communications(business_id);
CREATE INDEX idx_crm_comm_user_id ON public.crm_call_communications(user_id);
CREATE INDEX idx_crm_comm_phone_normalized ON public.crm_call_communications(phone_number_normalized);
CREATE INDEX idx_crm_comm_lead_id ON public.crm_call_communications(lead_id);
CREATE INDEX idx_crm_comm_contact_id ON public.crm_call_communications(contact_id);
CREATE INDEX idx_crm_comm_client_id ON public.crm_call_communications(client_id);
CREATE INDEX idx_crm_comm_account_id ON public.crm_call_communications(account_id);
CREATE INDEX idx_crm_comm_entity_id ON public.crm_call_communications(entity_id);
CREATE INDEX idx_crm_comm_dialer_session ON public.crm_call_communications(dialer_session_id);
CREATE INDEX idx_crm_comm_start_time ON public.crm_call_communications(start_time DESC);

ALTER TABLE public.crm_call_communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business communications"
ON public.crm_call_communications FOR SELECT TO authenticated
USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own business communications"
ON public.crm_call_communications FOR INSERT TO authenticated
WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own business communications"
ON public.crm_call_communications FOR UPDATE TO authenticated
USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- Create crm_callbacks table
CREATE TABLE IF NOT EXISTS public.crm_callbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  communication_id UUID REFERENCES public.crm_call_communications(id),
  entity_type TEXT,
  entity_id UUID,
  lead_id UUID,
  client_id UUID,
  project_id UUID,
  assigned_user_id UUID NOT NULL,
  callback_datetime TIMESTAMPTZ NOT NULL,
  callback_reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  completed_communication_id UUID REFERENCES public.crm_call_communications(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_callbacks_business ON public.crm_callbacks(business_id);
CREATE INDEX idx_crm_callbacks_assigned ON public.crm_callbacks(assigned_user_id);
CREATE INDEX idx_crm_callbacks_status ON public.crm_callbacks(status);
CREATE INDEX idx_crm_callbacks_datetime ON public.crm_callbacks(callback_datetime);

ALTER TABLE public.crm_callbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business callbacks"
ON public.crm_callbacks FOR SELECT TO authenticated
USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own business callbacks"
ON public.crm_callbacks FOR INSERT TO authenticated
WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own business callbacks"
ON public.crm_callbacks FOR UPDATE TO authenticated
USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE TRIGGER crm_comm_updated_at BEFORE UPDATE ON public.crm_call_communications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER crm_callbacks_updated_at BEFORE UPDATE ON public.crm_callbacks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();