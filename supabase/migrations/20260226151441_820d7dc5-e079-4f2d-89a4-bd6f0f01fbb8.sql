
-- =====================================================
-- STAGE 14: GEO, Analytics, Consent, Passkeys tables
-- =====================================================

-- Attach missing triggers from previous stages
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_user_created();

DROP TRIGGER IF EXISTS on_business_change ON public.businesses;
CREATE TRIGGER on_business_change
  AFTER INSERT OR UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.notify_business_status_change();

-- GEO Entities
CREATE TABLE IF NOT EXISTS public.geo_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'BUSINESS',
  name TEXT NOT NULL,
  attributes_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.geo_entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "geo_entities_tenant" ON public.geo_entities FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- GEO Relationships
CREATE TABLE IF NOT EXISTS public.geo_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) NOT NULL,
  from_entity_id UUID REFERENCES public.geo_entities(id) ON DELETE CASCADE NOT NULL,
  to_entity_id UUID REFERENCES public.geo_entities(id) ON DELETE CASCADE NOT NULL,
  relation_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.geo_relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "geo_relationships_tenant" ON public.geo_relationships FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Schema Items (JSON-LD)
CREATE TABLE IF NOT EXISTS public.schema_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) NOT NULL,
  schema_type TEXT NOT NULL,
  json_ld JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.schema_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schema_items_tenant" ON public.schema_items FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- GEO Answer Blocks
CREATE TABLE IF NOT EXISTS public.geo_answer_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) NOT NULL,
  query_intent TEXT NOT NULL,
  answer_text TEXT NOT NULL,
  citations TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.geo_answer_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "geo_answer_blocks_tenant" ON public.geo_answer_blocks FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Analytics Connections
CREATE TABLE IF NOT EXISTS public.analytics_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) NOT NULL,
  provider TEXT NOT NULL,
  auth_type TEXT NOT NULL DEFAULT 'OAUTH',
  external_account_id TEXT,
  scopes_json JSONB DEFAULT '[]',
  token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.analytics_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "analytics_connections_tenant" ON public.analytics_connections FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Analytics Daily Metrics
CREATE TABLE IF NOT EXISTS public.analytics_daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) NOT NULL,
  date DATE NOT NULL,
  sessions INTEGER DEFAULT 0,
  users_count INTEGER DEFAULT 0,
  leads_count INTEGER DEFAULT 0,
  calls_count INTEGER DEFAULT 0,
  gsc_clicks INTEGER DEFAULT 0,
  gsc_impressions INTEGER DEFAULT 0,
  gsc_ctr NUMERIC(5,2) DEFAULT 0,
  gsc_avg_position NUMERIC(6,2) DEFAULT 0,
  gbp_calls INTEGER DEFAULT 0,
  gbp_direction_requests INTEGER DEFAULT 0,
  gbp_website_clicks INTEGER DEFAULT 0,
  ads_spend NUMERIC(10,2) DEFAULT 0,
  ads_clicks INTEGER DEFAULT 0,
  ads_impressions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, date)
);
ALTER TABLE public.analytics_daily_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "analytics_daily_metrics_tenant" ON public.analytics_daily_metrics FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Consent Logs
CREATE TABLE IF NOT EXISTS public.consent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) NOT NULL,
  visitor_id TEXT NOT NULL,
  consent_state_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consent_logs_tenant" ON public.consent_logs FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Passkeys (future-ready)
CREATE TABLE IF NOT EXISTS public.passkeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL,
  public_key TEXT NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.passkeys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "passkeys_own" ON public.passkeys FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Add UTM fields to leads table
DO $$ BEGIN
  ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_source TEXT;
  ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_medium TEXT;
  ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
  ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_term TEXT;
  ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_content TEXT;
  ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS gclid TEXT;
  ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS fbclid TEXT;
  ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS landing_page_url TEXT;
  ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS referrer_url TEXT;
END $$;
