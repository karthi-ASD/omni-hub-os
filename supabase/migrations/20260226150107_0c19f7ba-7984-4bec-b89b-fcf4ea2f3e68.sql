
-- =====================================================
-- STAGE 13: Autonomous Expansion + Roll-Up + IPO + Franchise
-- =====================================================

-- A) Expansion Targets
CREATE TABLE public.expansion_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region TEXT NOT NULL,
  industry TEXT,
  demand_score NUMERIC NOT NULL DEFAULT 0,
  partner_gap_score NUMERIC NOT NULL DEFAULT 0,
  seo_opportunity_score NUMERIC NOT NULL DEFAULT 0,
  sales_density NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.expansion_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_expansion_targets" ON public.expansion_targets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- AI Expansion Strategies
CREATE TABLE public.ai_expansion_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_region TEXT NOT NULL,
  recommended_action TEXT NOT NULL DEFAULT 'RECRUIT_PARTNER',
  projected_roi NUMERIC NOT NULL DEFAULT 0,
  confidence NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_expansion_strategies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_ai_expansion" ON public.ai_expansion_strategies FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- B) Acquisition Targets
CREATE TABLE public.acquisition_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  arr NUMERIC NOT NULL DEFAULT 0,
  churn_rate NUMERIC NOT NULL DEFAULT 0,
  margin NUMERIC NOT NULL DEFAULT 0,
  tech_stack TEXT,
  integration_complexity_score NUMERIC NOT NULL DEFAULT 50,
  acquisition_score NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'IDENTIFIED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.acquisition_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_acquisition_targets" ON public.acquisition_targets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Acquisition Scenarios
CREATE TABLE public.acquisition_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id UUID REFERENCES public.acquisition_targets(id),
  purchase_price NUMERIC NOT NULL DEFAULT 0,
  projected_synergy NUMERIC NOT NULL DEFAULT 0,
  cost_savings NUMERIC NOT NULL DEFAULT 0,
  integration_plan_json JSONB,
  roi_projection NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.acquisition_scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_acquisition_scenarios" ON public.acquisition_scenarios FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- C) IPO Readiness
CREATE TABLE public.ipo_readiness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  governance_score NUMERIC NOT NULL DEFAULT 0,
  revenue_stability_score NUMERIC NOT NULL DEFAULT 0,
  audit_compliance_score NUMERIC NOT NULL DEFAULT 0,
  scalability_score NUMERIC NOT NULL DEFAULT 0,
  board_independence_score NUMERIC NOT NULL DEFAULT 0,
  overall_readiness_score NUMERIC NOT NULL DEFAULT 0,
  assessed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ipo_readiness ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_ipo_readiness" ON public.ipo_readiness FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- D) Franchise Models
CREATE TABLE public.franchise_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region TEXT NOT NULL,
  entry_fee NUMERIC NOT NULL DEFAULT 0,
  revenue_share_percentage NUMERIC NOT NULL DEFAULT 0,
  required_team_size INTEGER NOT NULL DEFAULT 1,
  projected_break_even_month INTEGER NOT NULL DEFAULT 12,
  support_cost NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.franchise_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_franchise_models" ON public.franchise_models FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Franchise Pipeline
CREATE TABLE public.franchise_pipeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_name TEXT NOT NULL,
  region TEXT NOT NULL,
  capital_available NUMERIC NOT NULL DEFAULT 0,
  experience_score NUMERIC NOT NULL DEFAULT 0,
  fit_score NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PROSPECT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.franchise_pipeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_franchise_pipeline" ON public.franchise_pipeline FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- E) Competitors
CREATE TABLE public.competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  estimated_arr NUMERIC NOT NULL DEFAULT 0,
  feature_overlap_score NUMERIC NOT NULL DEFAULT 0,
  pricing_comparison TEXT,
  strength_score NUMERIC NOT NULL DEFAULT 0,
  threat_level TEXT NOT NULL DEFAULT 'MEDIUM',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_competitors" ON public.competitors FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Competitive Benchmarks
CREATE TABLE public.competitive_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID REFERENCES public.competitors(id),
  metric TEXT NOT NULL,
  competitor_value NUMERIC NOT NULL DEFAULT 0,
  nextweb_value NUMERIC NOT NULL DEFAULT 0,
  delta NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.competitive_benchmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_competitive_benchmarks" ON public.competitive_benchmarks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- F) Capital Allocation Models
CREATE TABLE public.capital_allocation_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_type TEXT NOT NULL DEFAULT 'MARKETING',
  investment_amount NUMERIC NOT NULL DEFAULT 0,
  projected_roi NUMERIC NOT NULL DEFAULT 0,
  time_horizon INTEGER NOT NULL DEFAULT 12,
  risk_score NUMERIC NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.capital_allocation_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_capital_allocation" ON public.capital_allocation_models FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));
