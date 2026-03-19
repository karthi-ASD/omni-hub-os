
-- =====================================================
-- CUSTOM BUSINESS CRM CONFIGURATION & ACE1 DATA TABLES
-- =====================================================

-- 1. Per-business CRM configuration (tabs, fields, pipeline stages)
CREATE TABLE public.business_crm_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  config_type TEXT NOT NULL, -- 'tab', 'field', 'pipeline_stage'
  module TEXT NOT NULL, -- e.g. 'investor_pipeline', 'properties', 'partners'
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  is_required BOOLEAN DEFAULT false,
  field_type TEXT, -- 'text', 'number', 'select', 'date', etc. (for fields)
  options_json JSONB, -- dropdown options, stage colors, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, config_type, module, key)
);

ALTER TABLE public.business_crm_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business members can read CRM config"
  ON public.business_crm_config FOR SELECT TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Business admins can manage CRM config"
  ON public.business_crm_config FOR ALL TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- 2. Per-business theme preferences
CREATE TABLE public.business_theme_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE UNIQUE,
  theme_preset TEXT NOT NULL DEFAULT 'default', -- 'default', 'dark-gold', 'ocean', etc.
  custom_colors_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.business_theme_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business members can read theme config"
  ON public.business_theme_config FOR SELECT TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Business admins can manage theme config"
  ON public.business_theme_config FOR ALL TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- 3. Investor Pipeline (ACE1-specific but generic enough for other property businesses)
CREATE TABLE public.crm_investors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  investor_type TEXT DEFAULT 'individual', -- individual, smsf, trust, company
  budget_min NUMERIC,
  budget_max NUMERIC,
  finance_status TEXT DEFAULT 'unknown', -- pre-approved, conditional, unknown, not_ready
  investment_goals TEXT,
  preferred_locations TEXT[],
  preferred_property_types TEXT[], -- residential, commercial, industrial, development
  risk_profile TEXT DEFAULT 'moderate', -- conservative, moderate, aggressive
  pipeline_stage TEXT NOT NULL DEFAULT 'inquiry', 
  stage_changed_at TIMESTAMPTZ DEFAULT now(),
  assigned_to TEXT,
  notes TEXT,
  source TEXT, -- referral, website, event, partner
  tags TEXT[],
  custom_fields_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_investors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business members manage investors"
  ON public.crm_investors FOR ALL TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- 4. Properties Portfolio
CREATE TABLE public.crm_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  property_name TEXT NOT NULL,
  property_type TEXT NOT NULL DEFAULT 'residential', -- residential, commercial, industrial, development, land
  address TEXT,
  suburb TEXT,
  city TEXT,
  state TEXT,
  postcode TEXT,
  country TEXT DEFAULT 'Australia',
  listing_price NUMERIC,
  estimated_yield NUMERIC, -- percentage
  estimated_growth NUMERIC, -- percentage p.a.
  bedrooms INT,
  bathrooms INT,
  parking INT,
  land_size_sqm NUMERIC,
  building_size_sqm NUMERIC,
  availability TEXT DEFAULT 'available', -- available, under_offer, settled, off_market, pre_market
  is_off_market BOOLEAN DEFAULT false,
  developer_name TEXT,
  description TEXT,
  features TEXT[],
  images_json JSONB DEFAULT '[]',
  documents_json JSONB DEFAULT '[]',
  matched_investor_ids UUID[],
  custom_fields_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business members manage properties"
  ON public.crm_properties FOR ALL TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- 5. Partner Network
CREATE TABLE public.crm_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  partner_name TEXT NOT NULL,
  company_name TEXT,
  partner_type TEXT NOT NULL DEFAULT 'broker', -- broker, lawyer, accountant, developer, finance, other
  email TEXT,
  phone TEXT,
  specialization TEXT,
  commission_structure TEXT,
  relationship_status TEXT DEFAULT 'active', -- active, inactive, prospective
  referral_count INT DEFAULT 0,
  total_deal_value NUMERIC DEFAULT 0,
  notes TEXT,
  tags TEXT[],
  custom_fields_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business members manage partners"
  ON public.crm_partners FOR ALL TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- 6. Deals / Transactions linking investors to properties
CREATE TABLE public.crm_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  deal_name TEXT NOT NULL,
  investor_id UUID REFERENCES public.crm_investors(id) ON DELETE SET NULL,
  property_id UUID REFERENCES public.crm_properties(id) ON DELETE SET NULL,
  partner_id UUID REFERENCES public.crm_partners(id) ON DELETE SET NULL,
  deal_stage TEXT NOT NULL DEFAULT 'prospecting',
  deal_value NUMERIC,
  commission_amount NUMERIC,
  settlement_date DATE,
  finance_approved BOOLEAN DEFAULT false,
  notes TEXT,
  custom_fields_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business members manage deals"
  ON public.crm_deals FOR ALL TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- 7. Activity log for CRM actions
CREATE TABLE public.crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'note', 'call', 'email', 'meeting', 'property_match', 'stage_change'
  entity_type TEXT NOT NULL, -- 'investor', 'property', 'partner', 'deal'
  entity_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  performed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business members manage activities"
  ON public.crm_activities FOR ALL TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));
