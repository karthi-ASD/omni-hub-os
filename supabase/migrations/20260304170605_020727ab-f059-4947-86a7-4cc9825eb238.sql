
-- AI Brain tables for Stage 26

CREATE TABLE public.ai_business_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  health_score NUMERIC NOT NULL DEFAULT 0,
  growth_score NUMERIC NOT NULL DEFAULT 0,
  risk_score NUMERIC NOT NULL DEFAULT 0,
  factors_json JSONB,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  forecast_type TEXT NOT NULL DEFAULT 'revenue',
  predicted_value NUMERIC NOT NULL DEFAULT 0,
  confidence_score NUMERIC,
  forecast_date DATE,
  factors_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_team_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  employee_id UUID,
  employee_name TEXT,
  performance_score NUMERIC NOT NULL DEFAULT 0,
  conversion_rate NUMERIC,
  task_completion_rate NUMERIC,
  response_time_minutes NUMERIC,
  factors_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_business_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'MEDIUM',
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_advisor_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID,
  question TEXT NOT NULL,
  ai_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.ai_business_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_team_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_business_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_advisor_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business health" ON public.ai_business_health FOR SELECT TO authenticated USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can insert own business health" ON public.ai_business_health FOR INSERT TO authenticated WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view own forecasts" ON public.ai_forecasts FOR SELECT TO authenticated USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can insert own forecasts" ON public.ai_forecasts FOR INSERT TO authenticated WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view own team metrics" ON public.ai_team_metrics FOR SELECT TO authenticated USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can insert own team metrics" ON public.ai_team_metrics FOR INSERT TO authenticated WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view own alerts" ON public.ai_business_alerts FOR SELECT TO authenticated USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can insert own alerts" ON public.ai_business_alerts FOR INSERT TO authenticated WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can update own alerts" ON public.ai_business_alerts FOR UPDATE TO authenticated USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view own advisor logs" ON public.ai_advisor_logs FOR SELECT TO authenticated USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can insert own advisor logs" ON public.ai_advisor_logs FOR INSERT TO authenticated WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_business_alerts;
