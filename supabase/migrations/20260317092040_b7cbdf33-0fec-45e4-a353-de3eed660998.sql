
-- SEO Lead Capture Forms
CREATE TABLE public.seo_lead_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  seo_project_id UUID NOT NULL REFERENCES public.seo_projects(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id),
  form_name TEXT NOT NULL DEFAULT 'Contact Form',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Dynamic form fields
CREATE TABLE public.seo_lead_form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.seo_lead_forms(id) ON DELETE CASCADE,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text',
  field_options JSONB,
  is_required BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Captured leads from forms and call clicks
CREATE TABLE public.seo_captured_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  seo_project_id UUID NOT NULL REFERENCES public.seo_projects(id),
  client_id UUID REFERENCES public.clients(id),
  name TEXT,
  email TEXT,
  phone TEXT,
  message TEXT,
  source TEXT NOT NULL DEFAULT 'form',
  page_url TEXT,
  form_id UUID REFERENCES public.seo_lead_forms(id),
  extra_data JSONB,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Per-project automation settings
CREATE TABLE public.seo_automation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  seo_project_id UUID NOT NULL REFERENCES public.seo_projects(id) UNIQUE,
  client_id UUID REFERENCES public.clients(id),
  whatsapp_number TEXT,
  whatsapp_connected BOOLEAN DEFAULT false,
  enable_email BOOLEAN DEFAULT false,
  enable_whatsapp BOOLEAN DEFAULT false,
  enable_call BOOLEAN DEFAULT false,
  enable_acknowledgment BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.seo_lead_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_lead_form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_captured_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_automation_settings ENABLE ROW LEVEL SECURITY;

-- Policies for seo_lead_forms
CREATE POLICY "Staff can manage lead forms" ON public.seo_lead_forms
  FOR ALL TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- Policies for seo_lead_form_fields
CREATE POLICY "Staff can manage form fields" ON public.seo_lead_form_fields
  FOR ALL TO authenticated
  USING (form_id IN (SELECT id FROM public.seo_lead_forms WHERE business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid())))
  WITH CHECK (form_id IN (SELECT id FROM public.seo_lead_forms WHERE business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid())));

-- Policies for seo_captured_leads
CREATE POLICY "Staff can view captured leads" ON public.seo_captured_leads
  FOR ALL TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- Allow anon inserts for external API
CREATE POLICY "Allow anonymous lead inserts" ON public.seo_captured_leads
  FOR INSERT TO anon
  WITH CHECK (true);

-- Policies for seo_automation_settings
CREATE POLICY "Staff can manage automation settings" ON public.seo_automation_settings
  FOR ALL TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.seo_captured_leads;
