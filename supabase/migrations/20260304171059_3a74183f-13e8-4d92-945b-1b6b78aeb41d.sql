
-- AI Learning tables for Stage 27

CREATE TABLE public.ai_learning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  data_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_model_training (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  model_type TEXT NOT NULL,
  training_data_size INTEGER NOT NULL DEFAULT 0,
  accuracy_score NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending',
  summary TEXT,
  trained_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_behavior_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence_score NUMERIC NOT NULL DEFAULT 0,
  recommendation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_workflow_adaptations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  workflow_type TEXT NOT NULL,
  adaptation_reason TEXT NOT NULL,
  applied_changes JSONB,
  status TEXT NOT NULL DEFAULT 'suggested',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.ai_learning_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_model_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_behavior_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_workflow_adaptations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own learning events" ON public.ai_learning_events FOR SELECT TO authenticated USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can insert own learning events" ON public.ai_learning_events FOR INSERT TO authenticated WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view own model training" ON public.ai_model_training FOR SELECT TO authenticated USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can insert own model training" ON public.ai_model_training FOR INSERT TO authenticated WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can update own model training" ON public.ai_model_training FOR UPDATE TO authenticated USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view own behavior patterns" ON public.ai_behavior_patterns FOR SELECT TO authenticated USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can insert own behavior patterns" ON public.ai_behavior_patterns FOR INSERT TO authenticated WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view own workflow adaptations" ON public.ai_workflow_adaptations FOR SELECT TO authenticated USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can insert own workflow adaptations" ON public.ai_workflow_adaptations FOR INSERT TO authenticated WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can update own workflow adaptations" ON public.ai_workflow_adaptations FOR UPDATE TO authenticated USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
