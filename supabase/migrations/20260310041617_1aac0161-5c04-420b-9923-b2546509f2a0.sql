
-- SEO Projects
CREATE TABLE public.seo_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id),
  website_domain TEXT NOT NULL,
  project_name TEXT NOT NULL,
  target_location TEXT,
  target_keywords_json JSONB DEFAULT '[]'::jsonb,
  primary_keyword TEXT,
  service_package TEXT DEFAULT 'basic',
  seo_manager_id UUID,
  seo_specialist_id UUID,
  project_status TEXT NOT NULL DEFAULT 'ACTIVE',
  contract_start DATE,
  contract_end DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.seo_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seo_projects_tenant" ON public.seo_projects FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- SEO Tasks
CREATE TABLE public.seo_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  seo_project_id UUID NOT NULL REFERENCES public.seo_projects(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id),
  task_category TEXT NOT NULL DEFAULT 'TECHNICAL_SEO',
  task_title TEXT NOT NULL,
  task_description TEXT,
  assigned_to_employee_id UUID,
  priority TEXT NOT NULL DEFAULT 'MEDIUM',
  status TEXT NOT NULL DEFAULT 'PENDING',
  deadline DATE,
  progress_percent INTEGER DEFAULT 0,
  result_notes TEXT,
  is_visible_to_client BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.seo_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seo_tasks_tenant" ON public.seo_tasks FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- GMB Tasks
CREATE TABLE public.gmb_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id),
  seo_project_id UUID NOT NULL REFERENCES public.seo_projects(id) ON DELETE CASCADE,
  post_type TEXT NOT NULL DEFAULT 'UPDATE',
  post_caption TEXT,
  image_urls_json JSONB DEFAULT '[]'::jsonb,
  cta_text TEXT,
  scheduled_date DATE,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.gmb_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gmb_tasks_tenant" ON public.gmb_tasks FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- SEO Blogs
CREATE TABLE public.seo_blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id),
  seo_project_id UUID NOT NULL REFERENCES public.seo_projects(id) ON DELETE CASCADE,
  blog_title TEXT NOT NULL,
  blog_topic TEXT,
  target_keywords_json JSONB DEFAULT '[]'::jsonb,
  content_text TEXT,
  seo_score INTEGER,
  publish_date DATE,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  author_employee_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.seo_blogs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seo_blogs_tenant" ON public.seo_blogs FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Social Media Tasks
CREATE TABLE public.social_media_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id),
  seo_project_id UUID REFERENCES public.seo_projects(id) ON DELETE CASCADE,
  platform TEXT NOT NULL DEFAULT 'FACEBOOK',
  post_caption TEXT,
  image_url TEXT,
  hashtags TEXT,
  post_date DATE,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  assigned_employee_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.social_media_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "social_media_tasks_tenant" ON public.social_media_tasks FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Keyword Ranking History
CREATE TABLE public.keyword_ranking_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  keyword_id UUID NOT NULL,
  rank_position INTEGER,
  date_checked DATE NOT NULL DEFAULT CURRENT_DATE,
  search_engine TEXT DEFAULT 'google',
  device TEXT DEFAULT 'desktop',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.keyword_ranking_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "keyword_ranking_history_tenant" ON public.keyword_ranking_history FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- SEO Competitors
CREATE TABLE public.seo_competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id),
  seo_project_id UUID NOT NULL REFERENCES public.seo_projects(id) ON DELETE CASCADE,
  competitor_domain TEXT NOT NULL,
  competitor_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.seo_competitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seo_competitors_tenant" ON public.seo_competitors FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Competitor Keyword Rankings
CREATE TABLE public.competitor_keyword_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID NOT NULL REFERENCES public.seo_competitors(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  rank_position INTEGER,
  search_engine TEXT DEFAULT 'google',
  date_checked DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.competitor_keyword_rankings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "competitor_keyword_rankings_access" ON public.competitor_keyword_rankings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.seo_competitors sc WHERE sc.id = competitor_id AND (sc.business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.seo_competitors sc WHERE sc.id = competitor_id AND (sc.business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))));

-- GSC Data
CREATE TABLE public.gsc_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id),
  seo_project_id UUID REFERENCES public.seo_projects(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr NUMERIC(5,4) DEFAULT 0,
  position NUMERIC(6,2) DEFAULT 0,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.gsc_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gsc_data_tenant" ON public.gsc_data FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Add status column to existing seo_ai_recommendations if missing
ALTER TABLE public.seo_ai_recommendations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDING';

-- SEO Updates
CREATE TABLE public.seo_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id),
  seo_project_id UUID NOT NULL REFERENCES public.seo_projects(id) ON DELETE CASCADE,
  update_type TEXT NOT NULL DEFAULT 'TECHNICAL_FIX',
  title TEXT NOT NULL,
  description TEXT,
  metrics_json JSONB,
  visible_to_client BOOLEAN DEFAULT true,
  created_by_employee_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.seo_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seo_updates_tenant" ON public.seo_updates FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- SEO Client Messages
CREATE TABLE public.seo_client_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id),
  seo_project_id UUID NOT NULL REFERENCES public.seo_projects(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  attachment_url TEXT,
  sent_by_role TEXT NOT NULL DEFAULT 'SEO_TEAM',
  status TEXT NOT NULL DEFAULT 'SENT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.seo_client_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seo_client_messages_tenant" ON public.seo_client_messages FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- SEO Monthly Reports
CREATE TABLE public.seo_monthly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id),
  seo_project_id UUID NOT NULL REFERENCES public.seo_projects(id) ON DELETE CASCADE,
  report_month TEXT NOT NULL,
  report_data_json JSONB DEFAULT '{}'::jsonb,
  report_pdf_url TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.seo_monthly_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seo_monthly_reports_tenant" ON public.seo_monthly_reports FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Triggers
CREATE TRIGGER update_seo_projects_updated_at BEFORE UPDATE ON public.seo_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_seo_tasks_updated_at BEFORE UPDATE ON public.seo_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.seo_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.seo_client_messages;
