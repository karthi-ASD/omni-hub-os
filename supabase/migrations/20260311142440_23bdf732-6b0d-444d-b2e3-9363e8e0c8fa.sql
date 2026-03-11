
CREATE TABLE public.ai_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL DEFAULT 'monthly_summary',
  report_period TEXT NOT NULL,
  summary_text TEXT,
  data_snapshot_json JSONB,
  generated_by_user_id UUID,
  model_used TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_reports_business ON public.ai_reports(business_id);
ALTER TABLE public.ai_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business users manage ai reports" ON public.ai_reports
  FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));
