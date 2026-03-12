
-- SEO Domain Analysis / Crawl Queue
CREATE TABLE IF NOT EXISTS public.seo_domain_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  seo_project_id UUID REFERENCES public.seo_projects(id) ON DELETE SET NULL,
  domain TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  seo_score INTEGER DEFAULT 0,
  estimated_traffic INTEGER DEFAULT 0,
  total_pages_crawled INTEGER DEFAULT 0,
  total_keywords INTEGER DEFAULT 0,
  total_backlinks_est INTEGER DEFAULT 0,
  analysis_json JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_domain_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own business domain analyses" ON public.seo_domain_analyses FOR SELECT TO authenticated USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own business domain analyses" ON public.seo_domain_analyses FOR INSERT TO authenticated WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own business domain analyses" ON public.seo_domain_analyses FOR UPDATE TO authenticated USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- SEO Page Audit (page-by-page crawler results)
CREATE TABLE IF NOT EXISTS public.seo_page_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  domain_analysis_id UUID REFERENCES public.seo_domain_analyses(id) ON DELETE CASCADE,
  seo_project_id UUID REFERENCES public.seo_projects(id) ON DELETE SET NULL,
  page_url TEXT NOT NULL,
  seo_score INTEGER DEFAULT 0,
  title_tag TEXT,
  meta_description TEXT,
  h1_count INTEGER DEFAULT 0,
  heading_structure JSONB,
  word_count INTEGER DEFAULT 0,
  internal_links INTEGER DEFAULT 0,
  external_links INTEGER DEFAULT 0,
  images_without_alt INTEGER DEFAULT 0,
  has_canonical BOOLEAN DEFAULT false,
  has_schema BOOLEAN DEFAULT false,
  is_indexable BOOLEAN DEFAULT true,
  page_speed_score INTEGER,
  issues_json JSONB DEFAULT '[]',
  recommendations_json JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_page_audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own business page audits" ON public.seo_page_audits FOR SELECT TO authenticated USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own business page audits" ON public.seo_page_audits FOR INSERT TO authenticated WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- SEO Keyword Intelligence
CREATE TABLE IF NOT EXISTS public.seo_keyword_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  seo_project_id UUID REFERENCES public.seo_projects(id) ON DELETE SET NULL,
  domain_analysis_id UUID REFERENCES public.seo_domain_analyses(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  keyword_type TEXT DEFAULT 'primary',
  estimated_volume TEXT DEFAULT 'medium',
  difficulty_score INTEGER DEFAULT 50,
  current_position INTEGER,
  ranking_url TEXT,
  intent TEXT DEFAULT 'informational',
  opportunity_score INTEGER DEFAULT 50,
  is_branded BOOLEAN DEFAULT false,
  cluster_group TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_keyword_intelligence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own business keyword intelligence" ON public.seo_keyword_intelligence FOR SELECT TO authenticated USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own business keyword intelligence" ON public.seo_keyword_intelligence FOR INSERT TO authenticated WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own business keyword intelligence" ON public.seo_keyword_intelligence FOR UPDATE TO authenticated USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- SEO Internal Links
CREATE TABLE IF NOT EXISTS public.seo_internal_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  seo_project_id UUID REFERENCES public.seo_projects(id) ON DELETE SET NULL,
  source_url TEXT NOT NULL,
  target_url TEXT NOT NULL,
  anchor_text TEXT,
  link_type TEXT DEFAULT 'contextual',
  is_suggestion BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_internal_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own business internal links" ON public.seo_internal_links FOR SELECT TO authenticated USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own business internal links" ON public.seo_internal_links FOR INSERT TO authenticated WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own business internal links" ON public.seo_internal_links FOR UPDATE TO authenticated USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- SEO Roadmap Items
CREATE TABLE IF NOT EXISTS public.seo_roadmap_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  seo_project_id UUID REFERENCES public.seo_projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'technical',
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  estimated_impact TEXT DEFAULT 'medium',
  assigned_to UUID,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_roadmap_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own business roadmap" ON public.seo_roadmap_items FOR SELECT TO authenticated USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own business roadmap" ON public.seo_roadmap_items FOR INSERT TO authenticated WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own business roadmap" ON public.seo_roadmap_items FOR UPDATE TO authenticated USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- SEO Content Workflow
CREATE TABLE IF NOT EXISTS public.seo_content_workflow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  seo_project_id UUID REFERENCES public.seo_projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content_type TEXT DEFAULT 'blog',
  target_keyword TEXT,
  brief TEXT,
  status TEXT DEFAULT 'brief_created',
  assigned_writer UUID,
  seo_reviewer UUID,
  draft_content TEXT,
  seo_score INTEGER,
  published_url TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_content_workflow ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own business content workflow" ON public.seo_content_workflow FOR SELECT TO authenticated USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own business content workflow" ON public.seo_content_workflow FOR INSERT TO authenticated WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own business content workflow" ON public.seo_content_workflow FOR UPDATE TO authenticated USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- SEO Traffic Estimates
CREATE TABLE IF NOT EXISTS public.seo_traffic_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  seo_project_id UUID REFERENCES public.seo_projects(id) ON DELETE SET NULL,
  domain TEXT NOT NULL,
  estimated_monthly_traffic INTEGER DEFAULT 0,
  estimated_organic_value NUMERIC(12,2) DEFAULT 0,
  visibility_score INTEGER DEFAULT 0,
  branded_traffic_pct INTEGER DEFAULT 0,
  top_pages_json JSONB DEFAULT '[]',
  trend_json JSONB DEFAULT '[]',
  estimated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_traffic_estimates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own business traffic estimates" ON public.seo_traffic_estimates FOR SELECT TO authenticated USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own business traffic estimates" ON public.seo_traffic_estimates FOR INSERT TO authenticated WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));
