
-- Business CRM terminology overrides
CREATE TABLE public.crm_terminology (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  term_key TEXT NOT NULL,
  custom_label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, term_key)
);
ALTER TABLE public.crm_terminology ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business members manage crm_terminology" ON public.crm_terminology FOR ALL TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- Dashboard widget visibility
CREATE TABLE public.crm_dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  widget_key TEXT NOT NULL,
  widget_label TEXT NOT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, widget_key)
);
ALTER TABLE public.crm_dashboard_widgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business members manage crm_dashboard_widgets" ON public.crm_dashboard_widgets FOR ALL TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));
