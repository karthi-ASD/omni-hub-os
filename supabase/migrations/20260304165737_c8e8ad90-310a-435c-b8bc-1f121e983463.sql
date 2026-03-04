
-- AI Lead Scores table
CREATE TABLE public.ai_lead_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  lead_id UUID,
  lead_score INTEGER DEFAULT 0,
  conversion_probability NUMERIC DEFAULT 0,
  confidence_score NUMERIC DEFAULT 0,
  factors_json JSONB,
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ai_lead_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business lead scores"
  ON public.ai_lead_scores FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can insert own business lead scores"
  ON public.ai_lead_scores FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can update own business lead scores"
  ON public.ai_lead_scores FOR UPDATE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE INDEX idx_ai_lead_scores_business ON public.ai_lead_scores(business_id);
CREATE INDEX idx_ai_lead_scores_lead ON public.ai_lead_scores(lead_id);

-- AI Marketing Insights table
CREATE TABLE public.ai_marketing_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'organic',
  leads_generated INTEGER DEFAULT 0,
  conversion_rate NUMERIC DEFAULT 0,
  roi_score NUMERIC DEFAULT 0,
  spend NUMERIC DEFAULT 0,
  revenue_attributed NUMERIC DEFAULT 0,
  recommendations_json JSONB,
  period TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ai_marketing_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business marketing insights"
  ON public.ai_marketing_insights FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can insert own business marketing insights"
  ON public.ai_marketing_insights FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE INDEX idx_ai_marketing_insights_business ON public.ai_marketing_insights(business_id);

-- AI Recommendations table
CREATE TABLE public.ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'MEDIUM',
  title TEXT NOT NULL,
  description TEXT,
  impact_score INTEGER DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'pending',
  entity_type TEXT,
  entity_id TEXT,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business recommendations"
  ON public.ai_recommendations FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can insert own business recommendations"
  ON public.ai_recommendations FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can update own business recommendations"
  ON public.ai_recommendations FOR UPDATE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE INDEX idx_ai_recommendations_business ON public.ai_recommendations(business_id);
CREATE INDEX idx_ai_recommendations_status ON public.ai_recommendations(status);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_lead_scores;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_recommendations;
