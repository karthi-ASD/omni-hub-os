-- 1. Add missing fields to seo_projects (bringing in useful fields from seo_campaigns)
ALTER TABLE public.seo_projects
  ADD COLUMN IF NOT EXISTS competitors_json jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS target_locations_json jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS monthly_fee numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS billing_type text NOT NULL DEFAULT 'recurring',
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS assigned_content_writer_id uuid,
  ADD COLUMN IF NOT EXISTS onboarding_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS onboarding_notes text,
  ADD COLUMN IF NOT EXISTS target_radius_km integer,
  ADD COLUMN IF NOT EXISTS previous_seo_done boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS renewal_date date;

-- 2. Add seo_project_id to all campaign-linked tables for migration
ALTER TABLE public.seo_keywords
  ADD COLUMN IF NOT EXISTS seo_project_id uuid REFERENCES public.seo_projects(id) ON DELETE CASCADE;

ALTER TABLE public.seo_onpage_tasks
  ADD COLUMN IF NOT EXISTS seo_project_id uuid REFERENCES public.seo_projects(id) ON DELETE CASCADE;

ALTER TABLE public.seo_offpage_items
  ADD COLUMN IF NOT EXISTS seo_project_id uuid REFERENCES public.seo_projects(id) ON DELETE CASCADE;

ALTER TABLE public.seo_content_items
  ADD COLUMN IF NOT EXISTS seo_project_id uuid REFERENCES public.seo_projects(id) ON DELETE CASCADE;

ALTER TABLE public.seo_access_checklist
  ADD COLUMN IF NOT EXISTS seo_project_id uuid REFERENCES public.seo_projects(id) ON DELETE CASCADE;

ALTER TABLE public.seo_reports
  ADD COLUMN IF NOT EXISTS seo_project_id uuid REFERENCES public.seo_projects(id) ON DELETE CASCADE;

-- 3. Add search_volume and difficulty columns to seo_keywords
ALTER TABLE public.seo_keywords
  ADD COLUMN IF NOT EXISTS search_volume integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS difficulty integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS target_rank integer;

-- 4. Create indexes for the new seo_project_id columns
CREATE INDEX IF NOT EXISTS idx_seo_keywords_project ON public.seo_keywords(seo_project_id);
CREATE INDEX IF NOT EXISTS idx_seo_onpage_tasks_project ON public.seo_onpage_tasks(seo_project_id);
CREATE INDEX IF NOT EXISTS idx_seo_offpage_items_project ON public.seo_offpage_items(seo_project_id);
CREATE INDEX IF NOT EXISTS idx_seo_content_items_project ON public.seo_content_items(seo_project_id);
CREATE INDEX IF NOT EXISTS idx_seo_access_checklist_project ON public.seo_access_checklist(seo_project_id);
CREATE INDEX IF NOT EXISTS idx_seo_reports_project ON public.seo_reports(seo_project_id);

-- 5. Fix the auto_onboard_client_seo trigger to only fire for SEO service clients
CREATE OR REPLACE FUNCTION public.auto_onboard_client_seo()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _project_id UUID;
  _domain TEXT;
  _project_name TEXT;
  _has_seo_service BOOLEAN;
BEGIN
  -- Skip auto-onboarding for Xero-synced contacts
  IF NEW.xero_contact_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Check if client has an SEO service in client_services
  SELECT EXISTS (
    SELECT 1 FROM public.client_services
    WHERE client_id = NEW.id
      AND service_type = 'seo'
      AND service_status = 'active'
  ) INTO _has_seo_service;

  -- Only create SEO project if client has SEO service
  IF NOT _has_seo_service THEN
    RETURN NEW;
  END IF;

  _project_name := NEW.contact_name || ' - SEO Campaign';
  _domain := COALESCE(NEW.website, '');

  INSERT INTO public.seo_projects (
    business_id, client_id, website_domain, project_name,
    target_location, service_package, project_status, contract_start,
    onboarding_status
  ) VALUES (
    NEW.business_id, NEW.id, _domain, _project_name,
    COALESCE(NEW.city, NEW.state, 'Australia'), 'seo',
    'active', CURRENT_DATE, 'in_progress'
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

  UPDATE public.clients SET onboarding_status = 'in_progress' WHERE id = NEW.id;

  RETURN NEW;
END;
$function$;