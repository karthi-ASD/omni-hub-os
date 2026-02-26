
-- =====================================================
-- STAGE 12: VC-Ready Infrastructure + Global Expansion
-- =====================================================

-- A1) Corporate Entity Structure
CREATE TABLE public.corporate_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_name TEXT NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'OPERATING',
  jurisdiction TEXT,
  tax_structure_notes TEXT,
  parent_entity_id UUID REFERENCES public.corporate_entities(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.corporate_entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_corporate_entities" ON public.corporate_entities FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- A2) Regional Pricing Rules
CREATE TABLE public.regional_pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  package_id UUID,
  monthly_price NUMERIC NOT NULL DEFAULT 0,
  yearly_price NUMERIC NOT NULL DEFAULT 0,
  tax_rate NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.regional_pricing_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_regional_pricing" ON public.regional_pricing_rules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- A4) Data Room Documents
CREATE TABLE public.data_room_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL DEFAULT 'PRODUCT',
  title TEXT NOT NULL,
  file_url TEXT,
  version TEXT DEFAULT '1.0',
  access_level TEXT NOT NULL DEFAULT 'INTERNAL',
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.data_room_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_data_room" ON public.data_room_documents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- A5) Fundraising Rounds
CREATE TABLE public.fundraising_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_type TEXT NOT NULL DEFAULT 'SEED',
  target_amount NUMERIC NOT NULL DEFAULT 0,
  valuation_target NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PLANNING',
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.fundraising_rounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_fundraising" ON public.fundraising_rounds FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Investor Contacts
CREATE TABLE public.investor_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID REFERENCES public.fundraising_rounds(id),
  firm_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT,
  stage TEXT NOT NULL DEFAULT 'IDENTIFIED',
  notes TEXT,
  probability NUMERIC DEFAULT 0,
  next_followup_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.investor_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_investor_contacts" ON public.investor_contacts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- B1) AI Strategy Engine
CREATE TABLE public.ai_strategy_engine (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id),
  strategy_type TEXT NOT NULL DEFAULT 'SEO_GROWTH',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  goal_metrics_json JSONB,
  autonomy_level TEXT NOT NULL DEFAULT 'SUGGEST_ONLY',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_strategy_engine ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_ai_strategy" ON public.ai_strategy_engine FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- B2) Agent Interactions
CREATE TABLE public.agent_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_agent_id UUID REFERENCES public.ai_agents(id),
  target_agent_id UUID REFERENCES public.ai_agents(id),
  interaction_type TEXT NOT NULL,
  context_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.agent_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_agent_interactions" ON public.agent_interactions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- C1) Board & Governance
CREATE TABLE public.board_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'DIRECTOR',
  voting_power NUMERIC NOT NULL DEFAULT 1,
  appointed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_board_members" ON public.board_members FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE TABLE public.board_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_date DATE NOT NULL,
  agenda TEXT,
  minutes TEXT,
  resolution_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.board_meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_board_meetings" ON public.board_meetings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE TABLE public.resolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES public.board_meetings(id),
  resolution_text TEXT NOT NULL,
  vote_result TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.resolutions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_resolutions" ON public.resolutions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- D2) Valuation Scenarios
CREATE TABLE public.valuation_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_type TEXT NOT NULL DEFAULT 'STRATEGIC',
  multiple NUMERIC NOT NULL DEFAULT 10,
  projected_exit_value NUMERIC NOT NULL DEFAULT 0,
  sensitivity_analysis_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.valuation_scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_valuation_scenarios" ON public.valuation_scenarios FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- G) Risk Register
CREATE TABLE public.risk_register (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_category TEXT NOT NULL DEFAULT 'TECH',
  description TEXT NOT NULL,
  impact_level TEXT NOT NULL DEFAULT 'MEDIUM',
  mitigation_plan TEXT,
  owner TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.risk_register ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_risk_register" ON public.risk_register FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));
