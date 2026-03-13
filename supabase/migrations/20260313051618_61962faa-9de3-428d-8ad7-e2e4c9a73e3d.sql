ALTER TABLE public.hr_employees 
  ADD COLUMN IF NOT EXISTS is_department_head boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS availability_status text DEFAULT 'offline',
  ADD COLUMN IF NOT EXISTS skill_tags text[] DEFAULT '{}';