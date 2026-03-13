
-- Add reporting_manager_id to hr_employees if not exists
ALTER TABLE public.hr_employees 
ADD COLUMN IF NOT EXISTS reporting_manager_id uuid REFERENCES public.hr_employees(id);
