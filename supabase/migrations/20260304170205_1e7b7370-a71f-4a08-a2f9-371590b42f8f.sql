
-- Growth Campaigns
CREATE TABLE public.growth_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'organic',
  budget NUMERIC DEFAULT 0,
  current_spend NUMERIC DEFAULT 0,
  conversion_rate NUMERIC DEFAULT 0,
  leads_generated INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  auto_adjust BOOLEAN DEFAULT false,
  last_adjustment TIMESTAMPTZ,
  adjustment_history_json JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.growth_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "growth_campaigns_select" ON public.growth_campaigns FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "growth_campaigns_insert" ON public.growth_campaigns FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "growth_campaigns_update" ON public.growth_campaigns FOR UPDATE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "growth_campaigns_delete" ON public.growth_campaigns FOR DELETE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE INDEX idx_growth_campaigns_biz ON public.growth_campaigns(business_id);

-- Growth Experiments (A/B Testing)
CREATE TABLE public.growth_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  experiment_name TEXT NOT NULL,
  experiment_type TEXT NOT NULL DEFAULT 'headline',
  variant_a TEXT,
  variant_b TEXT,
  winner TEXT,
  conversion_rate_a NUMERIC DEFAULT 0,
  conversion_rate_b NUMERIC DEFAULT 0,
  impressions_a INTEGER DEFAULT 0,
  impressions_b INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'running',
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.growth_experiments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "growth_experiments_select" ON public.growth_experiments FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "growth_experiments_insert" ON public.growth_experiments FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "growth_experiments_update" ON public.growth_experiments FOR UPDATE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE INDEX idx_growth_experiments_biz ON public.growth_experiments(business_id);

-- AI Landing Pages
CREATE TABLE public.ai_landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  title TEXT NOT NULL,
  headline TEXT,
  content_json JSONB,
  meta_description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  export_format TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.ai_landing_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_landing_pages_select" ON public.ai_landing_pages FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "ai_landing_pages_insert" ON public.ai_landing_pages FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "ai_landing_pages_update" ON public.ai_landing_pages FOR UPDATE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE INDEX idx_ai_landing_pages_biz ON public.ai_landing_pages(business_id);

-- SEO Autopilot Tasks
CREATE TABLE public.seo_autopilot_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  campaign_id UUID,
  task_type TEXT NOT NULL DEFAULT 'content',
  keyword TEXT,
  title TEXT,
  description TEXT,
  output_json JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.seo_autopilot_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seo_autopilot_tasks_select" ON public.seo_autopilot_tasks FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "seo_autopilot_tasks_insert" ON public.seo_autopilot_tasks FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "seo_autopilot_tasks_update" ON public.seo_autopilot_tasks FOR UPDATE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE INDEX idx_seo_autopilot_biz ON public.seo_autopilot_tasks(business_id);

-- Proposal Automations
CREATE TABLE public.proposal_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  lead_id UUID,
  lead_name TEXT,
  service_type TEXT,
  proposed_price NUMERIC DEFAULT 0,
  proposal_content_json JSONB,
  status TEXT NOT NULL DEFAULT 'generated',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.proposal_automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proposal_automations_select" ON public.proposal_automations FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "proposal_automations_insert" ON public.proposal_automations FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "proposal_automations_update" ON public.proposal_automations FOR UPDATE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE INDEX idx_proposal_automations_biz ON public.proposal_automations(business_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.growth_campaigns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.growth_experiments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_landing_pages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.proposal_automations;
