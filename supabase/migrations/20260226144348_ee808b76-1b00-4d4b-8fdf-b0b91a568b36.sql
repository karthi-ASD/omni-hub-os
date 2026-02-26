
-- =====================================================
-- STAGE 10: Enterprise Sales + AI Agents + Investor Pitch
-- =====================================================

-- A) PARTNER SYSTEM
CREATE TABLE public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_type text NOT NULL CHECK (partner_type IN ('franchise','reseller','affiliate')),
  parent_partner_id uuid REFERENCES public.partners(id),
  business_id uuid REFERENCES public.businesses(id),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  region text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins manage all partners" ON public.partners FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Business admins view own partners" ON public.partners FOR SELECT TO authenticated USING (has_role(auth.uid(), 'business_admin'::app_role) AND business_id = get_user_business_id(auth.uid()));

CREATE TABLE public.partner_commission_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_type text NOT NULL,
  plan_name text NOT NULL,
  commission_type text NOT NULL DEFAULT 'percentage' CHECK (commission_type IN ('percentage','fixed','tiered')),
  rules_json jsonb DEFAULT '{}'::jsonb,
  payout_schedule text NOT NULL DEFAULT 'monthly' CHECK (payout_schedule IN ('weekly','monthly')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.partner_commission_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins manage commission plans" ON public.partner_commission_plans FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Business admins view commission plans" ON public.partner_commission_plans FOR SELECT TO authenticated USING (has_role(auth.uid(), 'business_admin'::app_role));

CREATE TABLE public.partner_attribution (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id),
  lead_id uuid,
  deal_id uuid,
  tenant_business_id uuid REFERENCES public.businesses(id),
  attribution_source text NOT NULL DEFAULT 'manual_assign' CHECK (attribution_source IN ('referral_link','code','manual_assign')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.partner_attribution ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins manage all attribution" ON public.partner_attribution FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE TABLE public.partner_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id),
  tenant_business_id uuid REFERENCES public.businesses(id),
  platform_invoice_id uuid,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','rejected')),
  approved_by_user_id uuid,
  payout_batch_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.partner_commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins manage all commissions" ON public.partner_commissions FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE TABLE public.partner_payout_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','processing','paid')),
  total_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.partner_payout_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins manage payout batches" ON public.partner_payout_batches FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));

-- B) AI AGENT SYSTEM
CREATE TABLE public.ai_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id),
  agent_name text NOT NULL,
  scope text NOT NULL CHECK (scope IN ('sales','seo','ads','support','reporting','collections')),
  autonomy_level text NOT NULL DEFAULT 'suggest_only' CHECK (autonomy_level IN ('suggest_only','auto_draft','auto_execute_approved')),
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business users manage own agents" ON public.ai_agents FOR ALL TO authenticated USING (business_id = get_user_business_id(auth.uid()));
CREATE POLICY "Super admins manage all agents" ON public.ai_agents FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE TABLE public.ai_agent_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  goal_type text NOT NULL CHECK (goal_type IN ('increase_leads','improve_rankings','reduce_churn','improve_collections')),
  target_metrics_json jsonb DEFAULT '{}'::jsonb,
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','completed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_agent_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage agent goals via agent" ON public.ai_agent_goals FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.ai_agents a WHERE a.id = agent_id AND (a.business_id = get_user_business_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role))));

CREATE TABLE public.ai_agent_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  related_entity_type text,
  related_entity_id uuid,
  task_title text NOT NULL,
  task_plan_json jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','running','needs_approval','executed','failed')),
  approval_required boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_agent_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage agent tasks via agent" ON public.ai_agent_tasks FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.ai_agents a WHERE a.id = agent_id AND (a.business_id = get_user_business_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role))));

CREATE TABLE public.ai_agent_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.ai_agent_tasks(id) ON DELETE CASCADE,
  action_type text NOT NULL CHECK (action_type IN ('create_task','send_email_draft','create_report','create_seo_tasks','propose_keywords','send_notification')),
  payload_json jsonb DEFAULT '{}'::jsonb,
  executed_at timestamptz,
  approved_by_user_id uuid,
  result_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_agent_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage agent actions via task" ON public.ai_agent_actions FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.ai_agent_tasks t JOIN public.ai_agents a ON a.id = t.agent_id WHERE t.id = task_id AND (a.business_id = get_user_business_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role))));

-- C) INVESTOR PITCH & VALUATION
CREATE TABLE public.investor_assumptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assumption_key text NOT NULL,
  value numeric NOT NULL DEFAULT 0,
  period text,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.investor_assumptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins manage assumptions" ON public.investor_assumptions FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE TABLE public.investor_decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_version text NOT NULL DEFAULT '1.0',
  generated_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  file_url text,
  narrative_type text NOT NULL DEFAULT 'seed' CHECK (narrative_type IN ('seed','pre_a','series_a')),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.investor_decks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins manage decks" ON public.investor_decks FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE TABLE public.valuation_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_type text NOT NULL DEFAULT 'saas_multiple' CHECK (model_type IN ('saas_multiple','dcf_simple')),
  inputs_json jsonb DEFAULT '{}'::jsonb,
  outputs_json jsonb DEFAULT '{}'::jsonb,
  generated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.valuation_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins manage valuation models" ON public.valuation_models FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Indexes
CREATE INDEX idx_partners_status ON public.partners(status);
CREATE INDEX idx_partner_commissions_status ON public.partner_commissions(status);
CREATE INDEX idx_ai_agents_business ON public.ai_agents(business_id);
CREATE INDEX idx_ai_agent_tasks_status ON public.ai_agent_tasks(status);
CREATE INDEX idx_ai_agent_tasks_agent ON public.ai_agent_tasks(agent_id);
