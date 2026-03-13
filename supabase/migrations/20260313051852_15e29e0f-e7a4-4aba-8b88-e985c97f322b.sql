ALTER TABLE public.hr_employees 
  ADD COLUMN IF NOT EXISTS job_role_description text,
  ADD COLUMN IF NOT EXISTS job_role_document_url text,
  ADD COLUMN IF NOT EXISTS job_role_document_name text;