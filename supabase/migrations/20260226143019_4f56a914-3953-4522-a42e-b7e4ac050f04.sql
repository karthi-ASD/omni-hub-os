
-- =====================================================
-- STAGE 7: SEO Operations Engine + Communications Layer
-- =====================================================

-- SEO Campaigns
CREATE TABLE public.seo_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'onboarding' CHECK (status IN ('onboarding','active','paused','completed')),
  primary_domain TEXT,
  service_areas_json JSONB DEFAULT '[]'::jsonb,
  target_services_json JSONB DEFAULT '[]'::jsonb,
  start_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SEO Access Checklist
CREATE TABLE public.seo_access_checklist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.seo_campaigns(id) ON DELETE CASCADE,
  item_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','requested','received','verified')),
  requested_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SEO Keywords
CREATE TABLE public.seo_keywords (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.seo_campaigns(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  keyword_type TEXT NOT NULL DEFAULT 'primary' CHECK (keyword_type IN ('primary','service','location','blog')),
  target_url TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','active','dropped')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SEO Rankings
CREATE TABLE public.seo_rankings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.seo_campaigns(id) ON DELETE CASCADE,
  keyword_id UUID REFERENCES public.seo_keywords(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  position INTEGER,
  search_engine TEXT NOT NULL DEFAULT 'google',
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SEO On-Page Tasks
CREATE TABLE public.seo_onpage_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.seo_campaigns(id) ON DELETE CASCADE,
  page_url TEXT,
  checklist_item TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','done','needs_client_approval')),
  assigned_to_user_id UUID,
  due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SEO Off-Page Items
CREATE TABLE public.seo_offpage_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.seo_campaigns(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'citation' CHECK (type IN ('citation','backlink','guest_post','profile','directory')),
  source_url TEXT,
  target_url TEXT,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','submitted','live','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SEO GBP (Google Business Profile)
CREATE TABLE public.seo_gbp (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.seo_campaigns(id) ON DELETE CASCADE,
  gbp_profile_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','needs_verification','suspended')),
  last_post_date DATE,
  reviews_count INTEGER DEFAULT 0,
  rating_avg NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SEO Content Items
CREATE TABLE public.seo_content_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.seo_campaigns(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'blog' CHECK (type IN ('service_page','location_page','blog','landing_page')),
  title TEXT NOT NULL,
  brief TEXT,
  status TEXT NOT NULL DEFAULT 'briefed' CHECK (status IN ('briefed','writing','review','client_approval','published')),
  assigned_writer_user_id UUID,
  target_url TEXT,
  due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SEO Client Requests
CREATE TABLE public.seo_client_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.seo_campaigns(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('keyword_change','service_area_change','target_service_change')),
  payload_json JSONB,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','under_review','approved','rejected')),
  submitted_by_client_user_id UUID,
  reviewed_by_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

-- SEO Reports
CREATE TABLE public.seo_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.seo_campaigns(id) ON DELETE CASCADE,
  report_month DATE NOT NULL,
  summary_json JSONB DEFAULT '{}'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Communications Providers
CREATE TABLE public.communications_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email','sms','whatsapp')),
  provider_type TEXT NOT NULL,
  credentials_json TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Communications Templates
CREATE TABLE public.communications_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email','sms','whatsapp')),
  template_key TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  variables_json JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Communications Sending Log
CREATE TABLE public.communications_sends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  provider_type TEXT,
  to_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','failed')),
  related_entity_type TEXT,
  related_entity_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.seo_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_access_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_onpage_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_offpage_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_gbp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_client_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications_sends ENABLE ROW LEVEL SECURITY;

-- RLS: Tenant-scoped for all SEO tables
CREATE POLICY "Tenant users manage SEO campaigns" ON public.seo_campaigns FOR ALL
  USING (business_id = get_user_business_id(auth.uid()));
CREATE POLICY "Super admins manage all SEO campaigns" ON public.seo_campaigns FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant users manage SEO access checklist" ON public.seo_access_checklist FOR ALL
  USING (business_id = get_user_business_id(auth.uid()));
CREATE POLICY "Super admins manage all SEO access checklist" ON public.seo_access_checklist FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant users manage SEO keywords" ON public.seo_keywords FOR ALL
  USING (business_id = get_user_business_id(auth.uid()));
CREATE POLICY "Super admins manage all SEO keywords" ON public.seo_keywords FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant users manage SEO rankings" ON public.seo_rankings FOR ALL
  USING (business_id = get_user_business_id(auth.uid()));
CREATE POLICY "Super admins manage all SEO rankings" ON public.seo_rankings FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant users manage SEO onpage tasks" ON public.seo_onpage_tasks FOR ALL
  USING (business_id = get_user_business_id(auth.uid()));
CREATE POLICY "Super admins manage all SEO onpage tasks" ON public.seo_onpage_tasks FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant users manage SEO offpage items" ON public.seo_offpage_items FOR ALL
  USING (business_id = get_user_business_id(auth.uid()));
CREATE POLICY "Super admins manage all SEO offpage items" ON public.seo_offpage_items FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant users manage SEO GBP" ON public.seo_gbp FOR ALL
  USING (business_id = get_user_business_id(auth.uid()));
CREATE POLICY "Super admins manage all SEO GBP" ON public.seo_gbp FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant users manage SEO content" ON public.seo_content_items FOR ALL
  USING (business_id = get_user_business_id(auth.uid()));
CREATE POLICY "Super admins manage all SEO content" ON public.seo_content_items FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant users manage SEO client requests" ON public.seo_client_requests FOR ALL
  USING (business_id = get_user_business_id(auth.uid()));
CREATE POLICY "Super admins manage all SEO client requests" ON public.seo_client_requests FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant users manage SEO reports" ON public.seo_reports FOR ALL
  USING (business_id = get_user_business_id(auth.uid()));
CREATE POLICY "Super admins manage all SEO reports" ON public.seo_reports FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Comms: tenant-scoped + platform (NULL business_id)
CREATE POLICY "Tenant users manage comms providers" ON public.communications_providers FOR ALL
  USING (business_id = get_user_business_id(auth.uid()) OR business_id IS NULL);
CREATE POLICY "Super admins manage all comms providers" ON public.communications_providers FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant users manage comms templates" ON public.communications_templates FOR ALL
  USING (business_id = get_user_business_id(auth.uid()) OR business_id IS NULL);
CREATE POLICY "Super admins manage all comms templates" ON public.communications_templates FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant users view comms sends" ON public.communications_sends FOR ALL
  USING (business_id = get_user_business_id(auth.uid()));
CREATE POLICY "Super admins manage all comms sends" ON public.communications_sends FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Client can view their SEO campaigns and reports
CREATE POLICY "Clients view own SEO campaigns" ON public.seo_campaigns FOR SELECT
  USING (EXISTS (SELECT 1 FROM clients c WHERE c.id = seo_campaigns.client_id AND c.user_id = auth.uid()));
CREATE POLICY "Clients view own SEO reports" ON public.seo_reports FOR SELECT
  USING (EXISTS (SELECT 1 FROM seo_campaigns sc JOIN clients c ON c.id = sc.client_id WHERE sc.id = seo_reports.campaign_id AND c.user_id = auth.uid()));
CREATE POLICY "Clients view own SEO keywords" ON public.seo_keywords FOR SELECT
  USING (EXISTS (SELECT 1 FROM seo_campaigns sc JOIN clients c ON c.id = sc.client_id WHERE sc.id = seo_keywords.campaign_id AND c.user_id = auth.uid()));

-- Clients can submit requests
CREATE POLICY "Clients insert SEO requests" ON public.seo_client_requests FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM seo_campaigns sc JOIN clients c ON c.id = sc.client_id WHERE sc.id = seo_client_requests.campaign_id AND c.user_id = auth.uid()));
CREATE POLICY "Clients view own SEO requests" ON public.seo_client_requests FOR SELECT
  USING (submitted_by_client_user_id = auth.uid());

-- Updated_at triggers
CREATE TRIGGER update_seo_campaigns_updated_at BEFORE UPDATE ON public.seo_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
