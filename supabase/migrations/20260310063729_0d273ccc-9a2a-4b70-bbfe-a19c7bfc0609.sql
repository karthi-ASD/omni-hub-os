-- Auto-create SEO project + default tasks when a client is created
CREATE OR REPLACE FUNCTION public.auto_onboard_client_seo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _project_id UUID;
  _domain TEXT;
  _project_name TEXT;
BEGIN
  _project_name := NEW.contact_name || ' – SEO Campaign';
  _domain := COALESCE(NEW.website, '');

  INSERT INTO public.seo_projects (
    business_id, client_id, website_domain, project_name,
    target_location, service_package, project_status, contract_start
  ) VALUES (
    NEW.business_id, NEW.id, _domain, _project_name,
    COALESCE(NEW.city, NEW.state, 'Australia'), 'seo',
    'active', CURRENT_DATE
  ) RETURNING id INTO _project_id;

  INSERT INTO public.seo_tasks (business_id, seo_project_id, client_id, task_category, task_title, priority, status, deadline) VALUES
    (NEW.business_id, _project_id, NEW.id, 'audit',     'Website Audit',                  'high',   'pending', CURRENT_DATE + 7),
    (NEW.business_id, _project_id, NEW.id, 'research',  'Keyword Research',               'high',   'pending', CURRENT_DATE + 10),
    (NEW.business_id, _project_id, NEW.id, 'research',  'Competitor Analysis',            'high',   'pending', CURRENT_DATE + 10),
    (NEW.business_id, _project_id, NEW.id, 'technical', 'Technical SEO Audit',            'high',   'pending', CURRENT_DATE + 14),
    (NEW.business_id, _project_id, NEW.id, 'onpage',    'On-Page SEO Setup',              'medium', 'pending', CURRENT_DATE + 21),
    (NEW.business_id, _project_id, NEW.id, 'technical', 'Google Search Console Setup',    'high',   'pending', CURRENT_DATE + 7),
    (NEW.business_id, _project_id, NEW.id, 'technical', 'Google Analytics Setup',         'high',   'pending', CURRENT_DATE + 7),
    (NEW.business_id, _project_id, NEW.id, 'offpage',   'Backlink Strategy',              'medium', 'pending', CURRENT_DATE + 21),
    (NEW.business_id, _project_id, NEW.id, 'content',   'Content Plan Creation',          'medium', 'pending', CURRENT_DATE + 14),
    (NEW.business_id, _project_id, NEW.id, 'reporting', 'Monthly SEO Report Setup',       'low',    'pending', CURRENT_DATE + 30);

  INSERT INTO public.gsc_data (business_id, client_id, seo_project_id, query, clicks, impressions, ctr, position, date)
  VALUES (NEW.business_id, NEW.id, _project_id, '(awaiting connection)', 0, 0, 0, 0, CURRENT_DATE);

  INSERT INTO public.system_events (business_id, event_type, payload_json)
  VALUES (NEW.business_id, 'CLIENT_ONBOARDING_AUTO', jsonb_build_object(
    'client_id', NEW.id,
    'client_name', NEW.contact_name,
    'seo_project_id', _project_id
  ));

  NEW.onboarding_status := 'in_progress';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_onboard_client ON public.clients;
CREATE TRIGGER trg_auto_onboard_client
  BEFORE INSERT ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_onboard_client_seo();

CREATE TABLE IF NOT EXISTS public.client_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  seo_project_id UUID REFERENCES public.seo_projects(id) ON DELETE SET NULL,
  stage_name TEXT NOT NULL,
  stage_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_pipeline_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business pipeline stages"
  ON public.client_pipeline_stages FOR SELECT TO authenticated
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own business pipeline stages"
  ON public.client_pipeline_stages FOR INSERT TO authenticated
  WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own business pipeline stages"
  ON public.client_pipeline_stages FOR UPDATE TO authenticated
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.auto_create_pipeline_stages()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _project record;
BEGIN
  SELECT id INTO _project FROM public.seo_projects 
  WHERE client_id = NEW.id AND business_id = NEW.business_id 
  ORDER BY created_at DESC LIMIT 1;

  IF _project.id IS NOT NULL THEN
    INSERT INTO public.client_pipeline_stages (business_id, client_id, seo_project_id, stage_name, stage_order, status) VALUES
      (NEW.business_id, NEW.id, _project.id, 'Onboarding',        1, 'in_progress'),
      (NEW.business_id, NEW.id, _project.id, 'SEO Setup',         2, 'pending'),
      (NEW.business_id, NEW.id, _project.id, 'Optimization',      3, 'pending'),
      (NEW.business_id, NEW.id, _project.id, 'Content Growth',    4, 'pending'),
      (NEW.business_id, NEW.id, _project.id, 'Authority Building',5, 'pending'),
      (NEW.business_id, NEW.id, _project.id, 'Reporting',         6, 'pending');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_pipeline_stages ON public.clients;
CREATE TRIGGER trg_auto_pipeline_stages
  AFTER INSERT ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_pipeline_stages();