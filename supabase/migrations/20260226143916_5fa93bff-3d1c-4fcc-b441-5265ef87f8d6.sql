
-- Stage 9: AI Layer + White-Label SaaS Productization

-- AI tasks log
CREATE TABLE public.ai_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) NOT NULL,
  task_type TEXT NOT NULL,
  input_json JSONB DEFAULT '{}'::jsonb,
  output_json JSONB DEFAULT '{}'::jsonb,
  confidence_score NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business users view own ai tasks" ON public.ai_tasks FOR SELECT USING (business_id = get_user_business_id(auth.uid()));
CREATE POLICY "Business users insert ai tasks" ON public.ai_tasks FOR INSERT WITH CHECK (business_id = get_user_business_id(auth.uid()));
CREATE POLICY "Super admins manage all ai tasks" ON public.ai_tasks FOR ALL USING (has_role(auth.uid(), 'super_admin'));
CREATE INDEX idx_ai_tasks_business ON public.ai_tasks(business_id, created_at DESC);

-- AI sales forecasts
CREATE TABLE public.ai_sales_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) NOT NULL,
  period TEXT NOT NULL,
  projected_revenue NUMERIC NOT NULL DEFAULT 0,
  confidence NUMERIC,
  factors_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_sales_forecasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business users view own forecasts" ON public.ai_sales_forecasts FOR SELECT USING (business_id = get_user_business_id(auth.uid()));
CREATE POLICY "Business users insert forecasts" ON public.ai_sales_forecasts FOR INSERT WITH CHECK (business_id = get_user_business_id(auth.uid()));
CREATE POLICY "Super admins manage all forecasts" ON public.ai_sales_forecasts FOR ALL USING (has_role(auth.uid(), 'super_admin'));

-- SEO AI recommendations
CREATE TABLE public.seo_ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) NOT NULL,
  campaign_id UUID REFERENCES public.seo_campaigns(id),
  recommendation_type TEXT NOT NULL,
  page_url TEXT,
  recommendations_json JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.seo_ai_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business users view own seo recs" ON public.seo_ai_recommendations FOR SELECT USING (business_id = get_user_business_id(auth.uid()));
CREATE POLICY "Business users insert seo recs" ON public.seo_ai_recommendations FOR INSERT WITH CHECK (business_id = get_user_business_id(auth.uid()));
CREATE POLICY "Super admins manage all seo recs" ON public.seo_ai_recommendations FOR ALL USING (has_role(auth.uid(), 'super_admin'));

-- Voice sessions
CREATE TABLE public.voice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) NOT NULL,
  related_entity_type TEXT,
  related_entity_id UUID,
  transcript TEXT,
  summary TEXT,
  sentiment_score NUMERIC,
  duration_seconds INTEGER,
  provider TEXT DEFAULT 'twilio',
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business users view own voice sessions" ON public.voice_sessions FOR SELECT USING (business_id = get_user_business_id(auth.uid()));
CREATE POLICY "Business users insert voice sessions" ON public.voice_sessions FOR INSERT WITH CHECK (business_id = get_user_business_id(auth.uid()));
CREATE POLICY "Super admins manage all voice sessions" ON public.voice_sessions FOR ALL USING (has_role(auth.uid(), 'super_admin'));

-- White-label brands
CREATE TABLE public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_business_id UUID REFERENCES public.businesses(id) NOT NULL,
  brand_name TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#6366f1',
  secondary_color TEXT DEFAULT '#8b5cf6',
  domain TEXT,
  custom_css TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business admins manage own brands" ON public.brands FOR ALL USING (has_role(auth.uid(), 'business_admin') AND owner_business_id = get_user_business_id(auth.uid()));
CREATE POLICY "Super admins manage all brands" ON public.brands FOR ALL USING (has_role(auth.uid(), 'super_admin'));

-- Subscription packages
CREATE TABLE public.subscription_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  features_json JSONB DEFAULT '[]'::jsonb,
  max_users INTEGER NOT NULL DEFAULT 5,
  max_campaigns INTEGER NOT NULL DEFAULT 3,
  ai_enabled BOOLEAN NOT NULL DEFAULT false,
  white_label_enabled BOOLEAN NOT NULL DEFAULT false,
  monthly_price NUMERIC NOT NULL DEFAULT 0,
  yearly_price NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscription_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active packages" ON public.subscription_packages FOR SELECT USING (is_active = true);
CREATE POLICY "Super admins manage packages" ON public.subscription_packages FOR ALL USING (has_role(auth.uid(), 'super_admin'));

-- Tenant subscriptions
CREATE TABLE public.tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) NOT NULL UNIQUE,
  package_id UUID REFERENCES public.subscription_packages(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business admins view own subscription" ON public.tenant_subscriptions FOR SELECT USING (has_role(auth.uid(), 'business_admin') AND business_id = get_user_business_id(auth.uid()));
CREATE POLICY "Super admins manage all subscriptions" ON public.tenant_subscriptions FOR ALL USING (has_role(auth.uid(), 'super_admin'));

-- External API registry
CREATE TABLE public.external_api_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL,
  purpose TEXT NOT NULL,
  required_keys TEXT[] DEFAULT '{}',
  webhook_url TEXT,
  is_configured BOOLEAN NOT NULL DEFAULT false,
  last_tested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.external_api_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins manage api registry" ON public.external_api_registry FOR ALL USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Business admins view api registry" ON public.external_api_registry FOR SELECT USING (has_role(auth.uid(), 'business_admin'));

-- Add AI scoring columns to leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ai_score INTEGER;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ai_priority TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ai_recommended_action TEXT;

-- Performance indexes
CREATE INDEX idx_ai_tasks_type ON public.ai_tasks(task_type, created_at DESC);
CREATE INDEX idx_voice_sessions_business ON public.voice_sessions(business_id, created_at DESC);
CREATE INDEX idx_brands_owner ON public.brands(owner_business_id);
CREATE INDEX idx_leads_ai_score ON public.leads(business_id, ai_score DESC NULLS LAST);
