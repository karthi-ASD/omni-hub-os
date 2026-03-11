
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
BEGIN
  -- Skip auto-onboarding for Xero-synced contacts
  IF NEW.xero_contact_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

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
$function$;

-- Also change trigger to AFTER INSERT to fix FK constraint issue for non-Xero clients
DROP TRIGGER IF EXISTS trg_auto_onboard_client ON public.clients;
CREATE TRIGGER trg_auto_onboard_client
  AFTER INSERT ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_onboard_client_seo();

-- Since AFTER trigger can't modify NEW, we need a separate approach for onboarding_status
-- The function should use UPDATE instead of modifying NEW for AFTER triggers
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
BEGIN
  -- Skip auto-onboarding for Xero-synced contacts
  IF NEW.xero_contact_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

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

  -- Use UPDATE since AFTER trigger can't modify NEW
  UPDATE public.clients SET onboarding_status = 'in_progress' WHERE id = NEW.id;

  RETURN NEW;
END;
$function$;
