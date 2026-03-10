
-- Table: google_rank_checks
CREATE TABLE public.google_rank_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  seo_project_id UUID REFERENCES public.seo_projects(id) ON DELETE CASCADE,
  keyword_id UUID,
  keyword TEXT NOT NULL,
  location TEXT,
  device_type TEXT DEFAULT 'desktop',
  search_engine TEXT DEFAULT 'google',
  rank_position INTEGER,
  url_found TEXT,
  search_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.google_rank_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_google_rank_checks" ON public.google_rank_checks
  FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Table: seo_backlinks
CREATE TABLE public.seo_backlinks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  seo_project_id UUID REFERENCES public.seo_projects(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  target_url TEXT,
  anchor_text TEXT,
  domain_authority NUMERIC,
  link_type TEXT DEFAULT 'DOFOLLOW',
  status TEXT DEFAULT 'ACTIVE',
  date_found DATE DEFAULT CURRENT_DATE,
  last_checked TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.seo_backlinks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_seo_backlinks" ON public.seo_backlinks
  FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Table: seo_content_generation
CREATE TABLE public.seo_content_generation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  seo_project_id UUID REFERENCES public.seo_projects(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL DEFAULT 'BLOG',
  title TEXT NOT NULL,
  target_keyword TEXT,
  secondary_keywords_json JSONB DEFAULT '[]',
  generated_content TEXT,
  seo_score INTEGER,
  tone TEXT DEFAULT 'professional',
  status TEXT DEFAULT 'DRAFT',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.seo_content_generation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_seo_content_generation" ON public.seo_content_generation
  FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Table: seo_page_scores
CREATE TABLE public.seo_page_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  seo_project_id UUID REFERENCES public.seo_projects(id) ON DELETE CASCADE,
  page_url TEXT NOT NULL,
  page_title TEXT,
  primary_keyword TEXT,
  seo_score INTEGER DEFAULT 0,
  readability_score INTEGER,
  content_length INTEGER,
  keyword_density NUMERIC,
  internal_links_count INTEGER,
  images_count INTEGER,
  alt_tags_count INTEGER,
  technical_score INTEGER,
  meta_score INTEGER,
  content_score INTEGER,
  local_seo_score INTEGER,
  recommendations_json JSONB DEFAULT '[]',
  last_scanned_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.seo_page_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_seo_page_scores" ON public.seo_page_scores
  FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Table: seo_competitor_gap
CREATE TABLE public.seo_competitor_gap (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  seo_project_id UUID REFERENCES public.seo_projects(id) ON DELETE CASCADE,
  competitor_id UUID REFERENCES public.seo_competitors(id) ON DELETE SET NULL,
  keyword TEXT,
  client_rank INTEGER,
  competitor_rank INTEGER,
  gap_type TEXT DEFAULT 'KEYWORD_GAP',
  opportunity_score INTEGER,
  recommendation TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.seo_competitor_gap ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_seo_competitor_gap" ON public.seo_competitor_gap
  FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Add status column to seo_ai_recommendations if missing
ALTER TABLE public.seo_ai_recommendations ADD COLUMN IF NOT EXISTS estimated_impact TEXT;
ALTER TABLE public.seo_ai_recommendations ADD COLUMN IF NOT EXISTS suggested_action TEXT;
