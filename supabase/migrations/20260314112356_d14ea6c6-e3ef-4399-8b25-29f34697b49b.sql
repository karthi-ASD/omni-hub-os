
-- Table 1: daily_insights
CREATE TABLE public.daily_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  video_url TEXT,
  message TEXT,
  nextweb_application TEXT,
  department_target TEXT[] DEFAULT '{all}',
  priority_level TEXT NOT NULL DEFAULT 'normal',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  start_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,
  require_acknowledgement BOOLEAN DEFAULT false,
  allow_comments BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'published'
);

ALTER TABLE public.daily_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view insights for their business"
  ON public.daily_insights FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Admins can manage insights"
  ON public.daily_insights FOR ALL TO authenticated
  USING (
    business_id = public.get_user_business_id(auth.uid())
    AND (
      public.has_role(auth.uid(), 'super_admin')
      OR public.has_role(auth.uid(), 'business_admin')
      OR public.has_role(auth.uid(), 'hr_manager')
    )
  )
  WITH CHECK (
    business_id = public.get_user_business_id(auth.uid())
    AND (
      public.has_role(auth.uid(), 'super_admin')
      OR public.has_role(auth.uid(), 'business_admin')
      OR public.has_role(auth.uid(), 'hr_manager')
    )
  );

-- Table 2: employee_insight_views
CREATE TABLE public.employee_insight_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL,
  insight_id UUID NOT NULL REFERENCES public.daily_insights(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  view_status TEXT DEFAULT 'viewed',
  view_time TIMESTAMPTZ DEFAULT now(),
  acknowledged BOOLEAN DEFAULT false,
  UNIQUE(employee_id, insight_id)
);

ALTER TABLE public.employee_insight_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own insight views"
  ON public.employee_insight_views FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Users can insert own views"
  ON public.employee_insight_views FOR INSERT TO authenticated
  WITH CHECK (
    employee_id = auth.uid()
    AND business_id = public.get_user_business_id(auth.uid())
  );

CREATE POLICY "Users can update own views"
  ON public.employee_insight_views FOR UPDATE TO authenticated
  USING (employee_id = auth.uid() AND business_id = public.get_user_business_id(auth.uid()));

-- Table 3: insight_comments
CREATE TABLE public.insight_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_id UUID NOT NULL REFERENCES public.daily_insights(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.insight_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments for their business"
  ON public.insight_comments FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Users can insert own comments"
  ON public.insight_comments FOR INSERT TO authenticated
  WITH CHECK (
    employee_id = auth.uid()
    AND business_id = public.get_user_business_id(auth.uid())
  );
