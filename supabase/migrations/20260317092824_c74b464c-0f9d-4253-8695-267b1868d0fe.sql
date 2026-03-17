
-- Automation logs table
CREATE TABLE public.seo_automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.seo_captured_leads(id) ON DELETE CASCADE,
  seo_project_id UUID NOT NULL REFERENCES public.seo_projects(id),
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  automation_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'success',
  response_json JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.seo_automation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view automation logs" ON public.seo_automation_logs
  FOR ALL TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));
