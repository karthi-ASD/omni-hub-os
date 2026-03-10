
-- Task Updates / Progress Notes
CREATE TABLE public.hr_task_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.hr_employee_tasks(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  status_change TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hr_task_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hr_tu_select" ON public.hr_task_updates FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "hr_tu_insert" ON public.hr_task_updates FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Add assigned_by column to hr_employee_tasks if not exists
ALTER TABLE public.hr_employee_tasks ADD COLUMN IF NOT EXISTS assigned_by_name TEXT;
