-- Add seo_project_id to remaining campaign-linked tables
ALTER TABLE public.seo_gbp_profiles
  ADD COLUMN IF NOT EXISTS seo_project_id uuid REFERENCES public.seo_projects(id) ON DELETE CASCADE;

ALTER TABLE public.seo_technical_audits
  ADD COLUMN IF NOT EXISTS seo_project_id uuid REFERENCES public.seo_projects(id) ON DELETE CASCADE;

ALTER TABLE public.seo_communication_logs
  ADD COLUMN IF NOT EXISTS seo_project_id uuid REFERENCES public.seo_projects(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_seo_gbp_profiles_project ON public.seo_gbp_profiles(seo_project_id);
CREATE INDEX IF NOT EXISTS idx_seo_technical_audits_project ON public.seo_technical_audits(seo_project_id);
CREATE INDEX IF NOT EXISTS idx_seo_communication_logs_project ON public.seo_communication_logs(seo_project_id);