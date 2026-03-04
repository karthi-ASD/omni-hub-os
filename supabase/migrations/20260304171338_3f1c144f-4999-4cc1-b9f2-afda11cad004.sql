
-- Stage 28: Autonomous AI Agents Layer

CREATE TYPE public.agent_type AS ENUM ('SALES', 'MARKETING', 'SUPPORT', 'FINANCE');
CREATE TYPE public.agent_mode AS ENUM ('SUGGEST', 'EXECUTE', 'HYBRID');
CREATE TYPE public.agent_run_status AS ENUM ('QUEUED', 'RUNNING', 'NEEDS_APPROVAL', 'COMPLETED', 'FAILED', 'CANCELED');
CREATE TYPE public.agent_action_status AS ENUM ('PLANNED', 'EXECUTED', 'SKIPPED', 'FAILED');
CREATE TYPE public.risk_level AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE public.guardrail_enforcement AS ENUM ('BLOCK', 'REQUIRE_APPROVAL', 'WARN');
CREATE TYPE public.agent_approval_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- 4.1 ai_autonomous_agents
CREATE TABLE public.ai_autonomous_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  agent_type agent_type NOT NULL,
  mode agent_mode NOT NULL DEFAULT 'SUGGEST',
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  owner_user_id UUID,
  config_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.2 ai_playbooks
CREATE TABLE public.ai_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  agent_type agent_type NOT NULL,
  trigger_type TEXT NOT NULL DEFAULT 'MANUAL',
  trigger_filter_json JSONB,
  steps_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  requires_approval_default BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.3 ai_agent_runs_v2
CREATE TABLE public.ai_agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.ai_autonomous_agents(id) ON DELETE CASCADE,
  playbook_id UUID REFERENCES public.ai_playbooks(id) ON DELETE SET NULL,
  trigger_source TEXT NOT NULL DEFAULT 'MANUAL',
  trigger_ref TEXT,
  status agent_run_status NOT NULL DEFAULT 'QUEUED',
  confidence_score NUMERIC,
  input_json JSONB,
  output_json JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_by_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.4 ai_agent_actions_v2
CREATE TABLE public.ai_agent_actions_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  run_id UUID NOT NULL REFERENCES public.ai_agent_runs(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  target_table TEXT,
  target_id UUID,
  action_payload_json JSONB,
  execution_status agent_action_status NOT NULL DEFAULT 'PLANNED',
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  approval_request_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.5 ai_agent_guardrails
CREATE TABLE public.ai_agent_guardrails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  agent_type agent_type NOT NULL,
  risk_level risk_level NOT NULL DEFAULT 'MEDIUM',
  rule_name TEXT NOT NULL,
  rule_json JSONB,
  enforcement guardrail_enforcement NOT NULL DEFAULT 'REQUIRE_APPROVAL',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.6 ai_agent_approvals
CREATE TABLE public.ai_agent_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  run_id UUID NOT NULL REFERENCES public.ai_agent_runs(id) ON DELETE CASCADE,
  action_id UUID REFERENCES public.ai_agent_actions_v2(id) ON DELETE SET NULL,
  requested_by TEXT NOT NULL DEFAULT 'system',
  approver_role TEXT NOT NULL DEFAULT 'BUSINESS_ADMIN',
  status agent_approval_status NOT NULL DEFAULT 'PENDING',
  reason TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.7 ai_agent_tool_connections
CREATE TABLE public.ai_agent_tool_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'NOT_CONFIGURED',
  config_vault_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.8 ai_agent_knowledge_base
CREATE TABLE public.ai_agent_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL DEFAULT 'FAQ',
  title TEXT NOT NULL,
  content TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.ai_autonomous_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_actions_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_guardrails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_tool_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Policies (SELECT + INSERT + UPDATE for all, tenant-scoped)
CREATE POLICY "tenant_select" ON public.ai_autonomous_agents FOR SELECT TO authenticated USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "tenant_insert" ON public.ai_autonomous_agents FOR INSERT TO authenticated WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "tenant_update" ON public.ai_autonomous_agents FOR UPDATE TO authenticated USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "tenant_delete" ON public.ai_autonomous_agents FOR DELETE TO authenticated USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "tenant_select" ON public.ai_playbooks FOR SELECT TO authenticated USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "tenant_insert" ON public.ai_playbooks FOR INSERT TO authenticated WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "tenant_update" ON public.ai_playbooks FOR UPDATE TO authenticated USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "tenant_select" ON public.ai_agent_runs FOR SELECT TO authenticated USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "tenant_insert" ON public.ai_agent_runs FOR INSERT TO authenticated WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "tenant_update" ON public.ai_agent_runs FOR UPDATE TO authenticated USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "tenant_select" ON public.ai_agent_actions_v2 FOR SELECT TO authenticated USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "tenant_insert" ON public.ai_agent_actions_v2 FOR INSERT TO authenticated WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "tenant_update" ON public.ai_agent_actions_v2 FOR UPDATE TO authenticated USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "tenant_select" ON public.ai_agent_guardrails FOR SELECT TO authenticated USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "tenant_insert" ON public.ai_agent_guardrails FOR INSERT TO authenticated WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "tenant_update" ON public.ai_agent_guardrails FOR UPDATE TO authenticated USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "tenant_select" ON public.ai_agent_approvals FOR SELECT TO authenticated USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "tenant_insert" ON public.ai_agent_approvals FOR INSERT TO authenticated WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "tenant_update" ON public.ai_agent_approvals FOR UPDATE TO authenticated USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "tenant_select" ON public.ai_agent_tool_connections FOR SELECT TO authenticated USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "tenant_insert" ON public.ai_agent_tool_connections FOR INSERT TO authenticated WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "tenant_update" ON public.ai_agent_tool_connections FOR UPDATE TO authenticated USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "tenant_select" ON public.ai_agent_knowledge_base FOR SELECT TO authenticated USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "tenant_insert" ON public.ai_agent_knowledge_base FOR INSERT TO authenticated WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "tenant_update" ON public.ai_agent_knowledge_base FOR UPDATE TO authenticated USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Realtime for approvals + runs
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_agent_approvals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_agent_runs;
