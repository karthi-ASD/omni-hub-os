
-- Add solar-specific fields to projects table
ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS project_type text DEFAULT 'solar_installation',
  ADD COLUMN IF NOT EXISTS system_size_kw numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS estimated_value numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.leads(id) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS address text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pipeline_stage text DEFAULT 'new_project',
  ADD COLUMN IF NOT EXISTS contact_name text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS contact_phone text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS contact_email text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS roof_type text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS consumption_kwh numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS notes text DEFAULT NULL;

-- Project team assignments
CREATE TABLE IF NOT EXISTS public.project_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  role text NOT NULL DEFAULT 'installer',
  assigned_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.project_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_assignments_business" ON public.project_assignments
  FOR ALL USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- Site inspections
CREATE TABLE IF NOT EXISTS public.site_inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  inspection_date date DEFAULT NULL,
  inspector_id uuid REFERENCES auth.users(id) DEFAULT NULL,
  notes text DEFAULT NULL,
  images text[] DEFAULT '{}',
  roof_condition text DEFAULT NULL,
  electrical_panel_status text DEFAULT NULL,
  shading_analysis text DEFAULT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.site_inspections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_inspections_business" ON public.site_inspections
  FOR ALL USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- Installations
CREATE TABLE IF NOT EXISTS public.installations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  scheduled_date date DEFAULT NULL,
  completion_date date DEFAULT NULL,
  installer_team text DEFAULT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  completion_notes text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.installations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "installations_business" ON public.installations
  FOR ALL USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- Project materials
CREATE TABLE IF NOT EXISTS public.project_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  material_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_cost numeric DEFAULT NULL,
  status text NOT NULL DEFAULT 'pending',
  supplier text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.project_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_materials_business" ON public.project_materials
  FOR ALL USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- Project invoices
CREATE TABLE IF NOT EXISTS public.project_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  invoice_number text DEFAULT NULL,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  due_date date DEFAULT NULL,
  paid_date date DEFAULT NULL,
  notes text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.project_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_invoices_business" ON public.project_invoices
  FOR ALL USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- Project documents
CREATE TABLE IF NOT EXISTS public.project_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text NOT NULL,
  doc_type text NOT NULL DEFAULT 'general',
  uploaded_by uuid REFERENCES auth.users(id) DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_documents_business" ON public.project_documents
  FOR ALL USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- Storage bucket for project files
INSERT INTO storage.buckets (id, name, public) VALUES ('project-files', 'project-files', false) ON CONFLICT DO NOTHING;

-- Storage RLS for project-files
CREATE POLICY "project_files_auth_upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'project-files');
CREATE POLICY "project_files_auth_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'project-files');
CREATE POLICY "project_files_auth_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'project-files');
