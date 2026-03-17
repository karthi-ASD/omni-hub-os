ALTER TABLE public.analytics_connections
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.seo_projects(id),
  ADD COLUMN IF NOT EXISTS account_name TEXT,
  ADD COLUMN IF NOT EXISTS property_id TEXT,
  ADD COLUMN IF NOT EXISTS measurement_id TEXT,
  ADD COLUMN IF NOT EXISTS credentials_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_error TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_analytics_connections_project_id ON public.analytics_connections(project_id);