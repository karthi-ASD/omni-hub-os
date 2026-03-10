
-- AI SEO Audits
CREATE TABLE public.ai_seo_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  client_id UUID,
  project_id UUID,
  issues_json JSONB DEFAULT '[]'::jsonb,
  health_score NUMERIC DEFAULT 0,
  total_issues INTEGER DEFAULT 0,
  critical_issues INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_seo_audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view seo audits" ON public.ai_seo_audits FOR SELECT TO authenticated USING (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Users can insert seo audits" ON public.ai_seo_audits FOR INSERT TO authenticated WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

-- AI Keyword Clusters
CREATE TABLE public.ai_keyword_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  client_id UUID,
  cluster_name TEXT NOT NULL,
  cluster_type TEXT NOT NULL DEFAULT 'service',
  primary_keyword TEXT,
  keywords_json JSONB DEFAULT '[]'::jsonb,
  search_intent TEXT DEFAULT 'transactional',
  suggested_page_type TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'generated',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_keyword_clusters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view keyword clusters" ON public.ai_keyword_clusters FOR SELECT TO authenticated USING (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Users can insert keyword clusters" ON public.ai_keyword_clusters FOR INSERT TO authenticated WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

-- AI Content Briefs
CREATE TABLE public.ai_content_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  client_id UUID,
  brief_type TEXT NOT NULL DEFAULT 'service_page',
  target_keyword TEXT NOT NULL,
  secondary_keywords TEXT[],
  search_intent TEXT DEFAULT 'transactional',
  recommended_title TEXT,
  headings_json JSONB DEFAULT '[]'::jsonb,
  structure_json JSONB DEFAULT '{}'::jsonb,
  word_count_recommendation INTEGER DEFAULT 1200,
  schema_recommendation TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_content_briefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view content briefs" ON public.ai_content_briefs FOR SELECT TO authenticated USING (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Users can insert content briefs" ON public.ai_content_briefs FOR INSERT TO authenticated WITH CHECK (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Users can update content briefs" ON public.ai_content_briefs FOR UPDATE TO authenticated USING (business_id = public.get_user_business_id(auth.uid()));

-- AI Blog Drafts
CREATE TABLE public.ai_blog_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  client_id UUID,
  brief_id UUID REFERENCES public.ai_content_briefs(id),
  title TEXT NOT NULL,
  meta_title TEXT,
  meta_description TEXT,
  content TEXT,
  target_keyword TEXT,
  word_count INTEGER DEFAULT 0,
  tone TEXT DEFAULT 'professional',
  status TEXT NOT NULL DEFAULT 'draft',
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_blog_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view blog drafts" ON public.ai_blog_drafts FOR SELECT TO authenticated USING (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Users can insert blog drafts" ON public.ai_blog_drafts FOR INSERT TO authenticated WITH CHECK (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Users can update blog drafts" ON public.ai_blog_drafts FOR UPDATE TO authenticated USING (business_id = public.get_user_business_id(auth.uid()));

-- AI Outreach Prospects
CREATE TABLE public.ai_outreach_prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  client_id UUID,
  prospect_domain TEXT NOT NULL,
  domain_quality_score NUMERIC DEFAULT 0,
  relevance_score NUMERIC DEFAULT 0,
  contact_email TEXT,
  outreach_category TEXT DEFAULT 'guest_post',
  suggested_anchor TEXT,
  suggested_target_url TEXT,
  outreach_status TEXT NOT NULL DEFAULT 'identified',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_outreach_prospects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view outreach prospects" ON public.ai_outreach_prospects FOR SELECT TO authenticated USING (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Users can insert outreach prospects" ON public.ai_outreach_prospects FOR INSERT TO authenticated WITH CHECK (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Users can update outreach prospects" ON public.ai_outreach_prospects FOR UPDATE TO authenticated USING (business_id = public.get_user_business_id(auth.uid()));

-- AI Social Posts
CREATE TABLE public.ai_social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  client_id UUID,
  platform TEXT NOT NULL DEFAULT 'facebook',
  content_type TEXT DEFAULT 'promotional',
  caption TEXT NOT NULL,
  hashtags TEXT[],
  image_brief TEXT,
  scheduled_at TIMESTAMPTZ,
  cta TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_social_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view social posts" ON public.ai_social_posts FOR SELECT TO authenticated USING (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Users can insert social posts" ON public.ai_social_posts FOR INSERT TO authenticated WITH CHECK (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Users can update social posts" ON public.ai_social_posts FOR UPDATE TO authenticated USING (business_id = public.get_user_business_id(auth.uid()));

-- AI Competitor Analysis
CREATE TABLE public.ai_competitor_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  client_id UUID,
  competitor_domain TEXT NOT NULL,
  analysis_json JSONB DEFAULT '{}'::jsonb,
  keyword_gaps_json JSONB DEFAULT '[]'::jsonb,
  content_gaps_json JSONB DEFAULT '[]'::jsonb,
  opportunities_json JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_competitor_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view competitor analysis" ON public.ai_competitor_analysis FOR SELECT TO authenticated USING (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Users can insert competitor analysis" ON public.ai_competitor_analysis FOR INSERT TO authenticated WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

-- AI Execution Logs
CREATE TABLE public.ai_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  client_id UUID,
  project_id UUID,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  output_summary TEXT,
  approved_by UUID,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_execution_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view execution logs" ON public.ai_execution_logs FOR SELECT TO authenticated USING (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Users can insert execution logs" ON public.ai_execution_logs FOR INSERT TO authenticated WITH CHECK (business_id = public.get_user_business_id(auth.uid()));
