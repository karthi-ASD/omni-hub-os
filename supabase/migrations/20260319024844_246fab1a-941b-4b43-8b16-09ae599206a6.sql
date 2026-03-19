
-- Add package_id to seo_tasks for linking tasks to packages
ALTER TABLE public.seo_tasks ADD COLUMN IF NOT EXISTS package_id uuid REFERENCES public.client_packages(id) ON DELETE SET NULL;

-- Create trigger to auto-create default SEO tasks when a package is created
CREATE OR REPLACE FUNCTION public.auto_create_seo_tasks_for_package()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _has_seo_service BOOLEAN;
  _project_id UUID;
BEGIN
  -- Check if this package has an SEO-related service
  SELECT EXISTS (
    SELECT 1 FROM public.client_services
    WHERE client_id = NEW.client_id
      AND service_type = 'seo'
      AND service_status = 'active'
  ) INTO _has_seo_service;

  IF NOT _has_seo_service THEN
    RETURN NEW;
  END IF;

  -- Find existing SEO project for this client
  SELECT id INTO _project_id
  FROM public.seo_projects
  WHERE client_id = NEW.client_id AND business_id = NEW.business_id
  ORDER BY created_at DESC LIMIT 1;

  -- Create default SEO tasks
  INSERT INTO public.seo_tasks (business_id, seo_project_id, client_id, package_id, task_category, task_title, priority, status, deadline) VALUES
    (NEW.business_id, _project_id, NEW.client_id, NEW.id, 'TECHNICAL_SEO', 'Keyword Research', 'HIGH', 'PENDING', CURRENT_DATE + 7),
    (NEW.business_id, _project_id, NEW.client_id, NEW.id, 'LOCAL_SEO', 'Radius & Suburb Finalization', 'HIGH', 'PENDING', CURRENT_DATE + 10),
    (NEW.business_id, _project_id, NEW.client_id, NEW.id, 'ON_PAGE_SEO', 'Competitor Review', 'HIGH', 'PENDING', CURRENT_DATE + 10),
    (NEW.business_id, _project_id, NEW.client_id, NEW.id, 'ON_PAGE_SEO', 'On-Page SEO Setup', 'MEDIUM', 'PENDING', CURRENT_DATE + 21),
    (NEW.business_id, _project_id, NEW.client_id, NEW.id, 'GMB', 'GMB Optimization', 'MEDIUM', 'PENDING', CURRENT_DATE + 14),
    (NEW.business_id, _project_id, NEW.client_id, NEW.id, 'CONTENT', 'Reporting Setup', 'LOW', 'PENDING', CURRENT_DATE + 30);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_create_seo_tasks ON public.client_packages;
CREATE TRIGGER trigger_auto_create_seo_tasks
  AFTER INSERT ON public.client_packages
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_seo_tasks_for_package();
