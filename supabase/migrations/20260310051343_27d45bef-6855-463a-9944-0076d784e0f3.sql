
-- Leave Types
CREATE TABLE public.hr_leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  max_days_per_year INTEGER NOT NULL DEFAULT 12,
  carry_forward BOOLEAN NOT NULL DEFAULT false,
  approval_required BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Leave Requests
CREATE TABLE public.hr_leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES public.hr_leave_types(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  num_days NUMERIC NOT NULL DEFAULT 1,
  reason TEXT,
  attachment_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payroll Records (salary structure + monthly payroll)
CREATE TABLE public.hr_payroll_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  basic_salary NUMERIC NOT NULL DEFAULT 0,
  hra NUMERIC NOT NULL DEFAULT 0,
  allowances NUMERIC NOT NULL DEFAULT 0,
  overtime NUMERIC NOT NULL DEFAULT 0,
  bonus NUMERIC NOT NULL DEFAULT 0,
  deductions NUMERIC NOT NULL DEFAULT 0,
  pf_tax NUMERIC NOT NULL DEFAULT 0,
  net_salary NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','locked')),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance Reviews
CREATE TABLE public.hr_performance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  review_period TEXT NOT NULL,
  work_quality INTEGER CHECK (work_quality BETWEEN 1 AND 10),
  productivity INTEGER CHECK (productivity BETWEEN 1 AND 10),
  communication INTEGER CHECK (communication BETWEEN 1 AND 10),
  team_collaboration INTEGER CHECK (team_collaboration BETWEEN 1 AND 10),
  leadership INTEGER CHECK (leadership BETWEEN 1 AND 10),
  overall_rating NUMERIC,
  manager_feedback TEXT,
  hr_feedback TEXT,
  result TEXT CHECK (result IN ('excellent','good','needs_improvement')),
  reviewed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Employee Tasks
CREATE TABLE public.hr_employee_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  start_date DATE,
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','overdue')),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.hr_leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_employee_tasks ENABLE ROW LEVEL SECURITY;

-- Leave types policies
CREATE POLICY "hr_lt_select" ON public.hr_leave_types FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "hr_lt_insert" ON public.hr_leave_types FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "hr_lt_update" ON public.hr_leave_types FOR UPDATE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "hr_lt_delete" ON public.hr_leave_types FOR DELETE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Leave requests policies
CREATE POLICY "hr_lr_select" ON public.hr_leave_requests FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "hr_lr_insert" ON public.hr_leave_requests FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "hr_lr_update" ON public.hr_leave_requests FOR UPDATE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Payroll policies
CREATE POLICY "hr_pr_select" ON public.hr_payroll_records FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "hr_pr_insert" ON public.hr_payroll_records FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "hr_pr_update" ON public.hr_payroll_records FOR UPDATE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Performance reviews policies
CREATE POLICY "hr_rev_select" ON public.hr_performance_reviews FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "hr_rev_insert" ON public.hr_performance_reviews FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "hr_rev_update" ON public.hr_performance_reviews FOR UPDATE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Employee tasks policies
CREATE POLICY "hr_task_select" ON public.hr_employee_tasks FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "hr_task_insert" ON public.hr_employee_tasks FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "hr_task_update" ON public.hr_employee_tasks FOR UPDATE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "hr_task_delete" ON public.hr_employee_tasks FOR DELETE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Updated_at trigger for tasks
CREATE TRIGGER hr_tasks_updated_at BEFORE UPDATE ON public.hr_employee_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
