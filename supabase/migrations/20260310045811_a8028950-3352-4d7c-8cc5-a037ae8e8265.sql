
-- SEO Backlink Outreach
CREATE TABLE public.seo_backlink_outreach (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id),
  seo_project_id UUID REFERENCES public.seo_projects(id),
  target_domain TEXT NOT NULL,
  target_contact_name TEXT,
  target_email TEXT,
  contact_source TEXT,
  outreach_type TEXT NOT NULL DEFAULT 'GUEST_POST',
  pitch_subject TEXT,
  pitch_body TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  response_notes TEXT,
  assigned_employee_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_backlink_outreach ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON public.seo_backlink_outreach FOR ALL USING (
  business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid())
);

-- SEO Outreach Templates
CREATE TABLE public.seo_outreach_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL DEFAULT 'GUEST_POST',
  subject_template TEXT,
  body_template TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_outreach_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON public.seo_outreach_templates FOR ALL USING (
  business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid())
);

-- SEO Internal Link Suggestions
CREATE TABLE public.seo_internal_link_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id),
  seo_project_id UUID REFERENCES public.seo_projects(id),
  source_page_url TEXT NOT NULL,
  target_page_url TEXT NOT NULL,
  anchor_text TEXT,
  link_context TEXT,
  status TEXT NOT NULL DEFAULT 'SUGGESTED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_internal_link_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON public.seo_internal_link_suggestions FOR ALL USING (
  business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid())
);

-- SEO Page Audits
CREATE TABLE public.seo_page_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id),
  seo_project_id UUID REFERENCES public.seo_projects(id),
  page_url TEXT NOT NULL,
  audit_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  title_tag TEXT,
  meta_description TEXT,
  h1_tag TEXT,
  word_count INTEGER DEFAULT 0,
  internal_links_count INTEGER DEFAULT 0,
  external_links_count INTEGER DEFAULT 0,
  image_count INTEGER DEFAULT 0,
  missing_alt_tags_count INTEGER DEFAULT 0,
  canonical_url TEXT,
  page_speed_score NUMERIC DEFAULT 0,
  mobile_friendly BOOLEAN DEFAULT true,
  schema_present BOOLEAN DEFAULT false,
  broken_links_count INTEGER DEFAULT 0,
  seo_score NUMERIC DEFAULT 0,
  issues_json JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_page_audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON public.seo_page_audits FOR ALL USING (
  business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid())
);

-- SEO Content Workflow
CREATE TABLE public.seo_content_workflow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id),
  seo_project_id UUID REFERENCES public.seo_projects(id),
  content_type TEXT NOT NULL DEFAULT 'BLOG',
  title TEXT NOT NULL,
  target_keyword TEXT,
  generated_content TEXT,
  edited_content TEXT,
  approval_status TEXT NOT NULL DEFAULT 'DRAFT',
  approved_by UUID,
  publish_status TEXT NOT NULL DEFAULT 'NOT_PUBLISHED',
  publish_platform TEXT,
  publish_url TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_content_workflow ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON public.seo_content_workflow FOR ALL USING (
  business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid())
);

-- SEO CMS Connections
CREATE TABLE public.seo_cms_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id),
  platform TEXT NOT NULL DEFAULT 'WORDPRESS',
  site_url TEXT,
  api_endpoint TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_cms_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON public.seo_cms_connections FOR ALL USING (
  business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid())
);

-- SEO Roadmaps
CREATE TABLE public.seo_roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id),
  seo_project_id UUID REFERENCES public.seo_projects(id),
  roadmap_type TEXT NOT NULL DEFAULT '30_DAY',
  roadmap_title TEXT NOT NULL,
  roadmap_content_json JSONB DEFAULT '{}'::jsonb,
  generated_by TEXT DEFAULT 'AI',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_roadmaps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON public.seo_roadmaps FOR ALL USING (
  business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid())
);

-- Updated_at triggers
CREATE TRIGGER update_seo_backlink_outreach_updated_at BEFORE UPDATE ON public.seo_backlink_outreach FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_seo_content_workflow_updated_at BEFORE UPDATE ON public.seo_content_workflow FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
