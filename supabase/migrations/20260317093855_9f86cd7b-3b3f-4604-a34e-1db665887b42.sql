
-- Add API key column to seo_projects for secure external API access
ALTER TABLE public.seo_projects ADD COLUMN IF NOT EXISTS api_key TEXT;

-- Auto-generate API keys for existing projects that don't have one
UPDATE public.seo_projects SET api_key = gen_random_uuid()::text WHERE api_key IS NULL;

-- Create trigger to auto-generate API key on new project creation
CREATE OR REPLACE FUNCTION public.auto_generate_seo_api_key()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.api_key IS NULL THEN
    NEW.api_key := gen_random_uuid()::text;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_seo_project_api_key
  BEFORE INSERT ON public.seo_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_seo_api_key();

-- Add execution_time and error_message columns to automation logs if missing
ALTER TABLE public.seo_automation_logs ADD COLUMN IF NOT EXISTS execution_time_ms INTEGER;
ALTER TABLE public.seo_automation_logs ADD COLUMN IF NOT EXISTS error_message TEXT;
