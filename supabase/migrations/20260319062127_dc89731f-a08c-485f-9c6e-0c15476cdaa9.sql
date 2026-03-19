
-- Add more fields to crm_investors
ALTER TABLE public.crm_investors
  ADD COLUMN IF NOT EXISTS preferred_name TEXT,
  ADD COLUMN IF NOT EXISTS occupation TEXT,
  ADD COLUMN IF NOT EXISTS annual_income_band TEXT,
  ADD COLUMN IF NOT EXISTS entity_type_notes TEXT,
  ADD COLUMN IF NOT EXISTS smsf_status TEXT DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS investment_experience TEXT DEFAULT 'beginner',
  ADD COLUMN IF NOT EXISTS deposit_readiness TEXT DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS borrowing_capacity_band TEXT,
  ADD COLUMN IF NOT EXISTS timeline_to_invest TEXT,
  ADD COLUMN IF NOT EXISTS current_property_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referred_by TEXT,
  ADD COLUMN IF NOT EXISTS relationship_owner TEXT,
  ADD COLUMN IF NOT EXISTS investor_tier TEXT DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS communication_preference TEXT DEFAULT 'phone',
  ADD COLUMN IF NOT EXISTS preferred_meeting_mode TEXT DEFAULT 'in_person',
  ADD COLUMN IF NOT EXISTS long_term_goals TEXT;

-- Add more fields to crm_properties
ALTER TABLE public.crm_properties
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'residential_investment',
  ADD COLUMN IF NOT EXISTS listing_type TEXT DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS launch_stage TEXT,
  ADD COLUMN IF NOT EXISTS smsf_suitable BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS min_investment NUMERIC,
  ADD COLUMN IF NOT EXISTS completion_timeline TEXT,
  ADD COLUMN IF NOT EXISTS highlights TEXT[],
  ADD COLUMN IF NOT EXISTS risk_notes TEXT,
  ADD COLUMN IF NOT EXISTS commission_notes TEXT,
  ADD COLUMN IF NOT EXISTS investor_suitability_tags TEXT[];

-- Add more fields to crm_deals
ALTER TABLE public.crm_deals
  ADD COLUMN IF NOT EXISTS deal_type TEXT DEFAULT 'purchase',
  ADD COLUMN IF NOT EXISTS broker_id UUID REFERENCES public.crm_partners(id),
  ADD COLUMN IF NOT EXISTS lawyer_id UUID REFERENCES public.crm_partners(id),
  ADD COLUMN IF NOT EXISTS accountant_id UUID REFERENCES public.crm_partners(id),
  ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS expected_milestone TEXT,
  ADD COLUMN IF NOT EXISTS settlement_target_date DATE,
  ADD COLUMN IF NOT EXISTS deposit_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS eoi_status TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS contract_status TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS legal_status TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS blocker_summary TEXT,
  ADD COLUMN IF NOT EXISTS risk_rating TEXT DEFAULT 'low',
  ADD COLUMN IF NOT EXISTS next_action_owner TEXT;

-- CRM Leads (pre-qualification tracking)
CREATE TABLE public.crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  mobile TEXT,
  email TEXT,
  phone_verified BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  source TEXT,
  campaign_source TEXT,
  enquiry_at TIMESTAMPTZ DEFAULT now(),
  preferred_callback_time TEXT,
  state TEXT,
  city TEXT,
  budget_range TEXT,
  property_interest_type TEXT,
  finance_readiness TEXT DEFAULT 'unknown',
  smsf_interest BOOLEAN DEFAULT false,
  seriousness_score INT DEFAULT 0,
  lead_score INT DEFAULT 0,
  stage TEXT DEFAULT 'new',
  last_contact_attempt TIMESTAMPTZ,
  next_followup TIMESTAMPTZ,
  assigned_advisor TEXT,
  notes TEXT,
  invalid_reason TEXT,
  tags TEXT[],
  custom_fields_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business members manage crm_leads" ON public.crm_leads FOR ALL TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- CRM Projects
CREATE TABLE public.crm_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  developer_name TEXT,
  category TEXT DEFAULT 'residential',
  state TEXT,
  suburb TEXT,
  stage TEXT DEFAULT 'planning',
  launch_date DATE,
  completion_estimate DATE,
  stock_count INT,
  price_band TEXT,
  investor_type_fit TEXT[],
  summary TEXT,
  brochure_url TEXT,
  commission_notes TEXT,
  priority_rating TEXT DEFAULT 'medium',
  relationship_owner TEXT,
  status TEXT DEFAULT 'active',
  custom_fields_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business members manage crm_projects" ON public.crm_projects FOR ALL TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- CRM Developers
CREATE TABLE public.crm_developers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  developer_name TEXT NOT NULL,
  contact_person TEXT,
  business_type TEXT,
  years_active INT,
  collaboration_type TEXT,
  response_speed TEXT DEFAULT 'normal',
  trust_rating INT DEFAULT 3,
  active_project_count INT DEFAULT 0,
  past_project_count INT DEFAULT 0,
  notes TEXT,
  email TEXT,
  phone TEXT,
  custom_fields_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_developers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business members manage crm_developers" ON public.crm_developers FOR ALL TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- CRM Communications
CREATE TABLE public.crm_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  linked_type TEXT NOT NULL,
  linked_id UUID NOT NULL,
  channel TEXT NOT NULL DEFAULT 'call',
  subject TEXT,
  summary TEXT,
  outcome TEXT,
  action_required BOOLEAN DEFAULT false,
  next_step TEXT,
  performed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_communications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business members manage crm_communications" ON public.crm_communications FOR ALL TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- CRM Documents
CREATE TABLE public.crm_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  linked_investor_id UUID,
  linked_deal_id UUID,
  linked_opportunity_id UUID,
  file_url TEXT,
  uploaded_by TEXT,
  status TEXT DEFAULT 'active',
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business members manage crm_documents" ON public.crm_documents FOR ALL TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- CRM Tasks
CREATE TABLE public.crm_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  task_type TEXT DEFAULT 'general',
  linked_investor_id UUID,
  linked_lead_id UUID,
  linked_deal_id UUID,
  linked_partner_id UUID,
  owner TEXT,
  due_date DATE,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  reminder_at TIMESTAMPTZ,
  dependency TEXT,
  notes TEXT,
  completion_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business members manage crm_tasks" ON public.crm_tasks FOR ALL TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- CRM Automations
CREATE TABLE public.crm_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_event TEXT NOT NULL,
  condition_json JSONB DEFAULT '{}',
  action_type TEXT NOT NULL,
  action_config_json JSONB DEFAULT '{}',
  channel TEXT DEFAULT 'system',
  owner TEXT,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business members manage crm_automations" ON public.crm_automations FOR ALL TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));
