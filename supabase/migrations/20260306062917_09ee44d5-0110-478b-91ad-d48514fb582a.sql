
-- 1. Knowledge Base Articles (public-facing, extends existing ai_agent_knowledge_base)
CREATE TABLE public.kb_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  views_count INTEGER NOT NULL DEFAULT 0,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  not_helpful_count INTEGER NOT NULL DEFAULT 0,
  author_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.kb_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view published KB articles for their business"
  ON public.kb_articles FOR SELECT TO authenticated
  USING (
    status = 'published' AND business_id = public.get_user_business_id(auth.uid())
  );

CREATE POLICY "Admins can manage KB articles"
  ON public.kb_articles FOR ALL TO authenticated
  USING (
    business_id = public.get_user_business_id(auth.uid())
    AND (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'business_admin'))
  )
  WITH CHECK (
    business_id = public.get_user_business_id(auth.uid())
    AND (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'business_admin'))
  );

-- 2. Company Accounts
CREATE TABLE public.company_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  plan TEXT DEFAULT 'Starter',
  account_manager_user_id UUID,
  health_status TEXT NOT NULL DEFAULT 'good',
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  renewal_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.company_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company accounts for their business"
  ON public.company_accounts FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Admins can manage company accounts"
  ON public.company_accounts FOR ALL TO authenticated
  USING (
    business_id = public.get_user_business_id(auth.uid())
    AND (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'business_admin'))
  )
  WITH CHECK (
    business_id = public.get_user_business_id(auth.uid())
    AND (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'business_admin'))
  );

-- 3. Satisfaction Surveys
CREATE TABLE public.satisfaction_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  survey_type TEXT NOT NULL DEFAULT 'csat',
  status TEXT NOT NULL DEFAULT 'active',
  trigger_event TEXT DEFAULT 'ticket_resolved',
  questions_json JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.satisfaction_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view surveys for their business"
  ON public.satisfaction_surveys FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Admins can manage surveys"
  ON public.satisfaction_surveys FOR ALL TO authenticated
  USING (
    business_id = public.get_user_business_id(auth.uid())
    AND (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'business_admin'))
  )
  WITH CHECK (
    business_id = public.get_user_business_id(auth.uid())
    AND (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'business_admin'))
  );

-- 4. Survey Responses
CREATE TABLE public.survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  survey_id UUID REFERENCES public.satisfaction_surveys(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_email TEXT,
  score INTEGER,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view survey responses for their business"
  ON public.survey_responses FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Anyone can submit survey responses"
  ON public.survey_responses FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

-- 5. CS Automation Rules
CREATE TABLE public.cs_automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_event TEXT NOT NULL,
  action_type TEXT NOT NULL,
  config_json JSONB DEFAULT '{}',
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  runs_count INTEGER NOT NULL DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cs_automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view CS automation rules for their business"
  ON public.cs_automation_rules FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Admins can manage CS automation rules"
  ON public.cs_automation_rules FOR ALL TO authenticated
  USING (
    business_id = public.get_user_business_id(auth.uid())
    AND (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'business_admin'))
  )
  WITH CHECK (
    business_id = public.get_user_business_id(auth.uid())
    AND (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'business_admin'))
  );

-- 6. Add fields to support_tickets for CS CRM enhancements
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'email',
  ADD COLUMN IF NOT EXISTS sentiment TEXT,
  ADD COLUMN IF NOT EXISTS ai_summary TEXT,
  ADD COLUMN IF NOT EXISTS ai_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS company_account_id UUID REFERENCES public.company_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS csat_score INTEGER,
  ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS department TEXT;

-- 7. Customer Portal Settings
CREATE TABLE public.customer_portal_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  features_json JSONB DEFAULT '{"ticket_submission": true, "live_chat": true, "ai_chatbot": true, "ticket_tracking": true, "push_notifications": false, "invoice_history": true, "knowledge_base": true, "custom_branding": false}',
  branding_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_portal_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view portal settings for their business"
  ON public.customer_portal_settings FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Admins can manage portal settings"
  ON public.customer_portal_settings FOR ALL TO authenticated
  USING (
    business_id = public.get_user_business_id(auth.uid())
    AND (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'business_admin'))
  )
  WITH CHECK (
    business_id = public.get_user_business_id(auth.uid())
    AND (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'business_admin'))
  );

-- 8. AI Assistant Feature Settings
CREATE TABLE public.ai_cs_feature_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE UNIQUE,
  reply_suggestions BOOLEAN NOT NULL DEFAULT true,
  auto_categorization BOOLEAN NOT NULL DEFAULT true,
  sentiment_analysis BOOLEAN NOT NULL DEFAULT true,
  priority_detection BOOLEAN NOT NULL DEFAULT true,
  smart_routing BOOLEAN NOT NULL DEFAULT true,
  ticket_summary BOOLEAN NOT NULL DEFAULT false,
  intent_detection BOOLEAN NOT NULL DEFAULT true,
  escalation_prediction BOOLEAN NOT NULL DEFAULT false,
  ai_chatbot BOOLEAN NOT NULL DEFAULT true,
  kb_recommendations BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_cs_feature_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view AI CS settings for their business"
  ON public.ai_cs_feature_settings FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Admins can manage AI CS settings"
  ON public.ai_cs_feature_settings FOR ALL TO authenticated
  USING (
    business_id = public.get_user_business_id(auth.uid())
    AND (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'business_admin'))
  )
  WITH CHECK (
    business_id = public.get_user_business_id(auth.uid())
    AND (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'business_admin'))
  );
