
-- Departments table
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  head_user_id UUID,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- HR Employees (extended profiles)
CREATE TABLE public.hr_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID,
  department_id UUID REFERENCES public.departments(id),
  full_name TEXT NOT NULL,
  mobile_number TEXT,
  email TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT,
  current_address TEXT,
  permanent_address TEXT,
  employee_code TEXT,
  designation TEXT,
  joining_date DATE,
  work_location TEXT,
  employment_type TEXT NOT NULL DEFAULT 'full_time' CHECK (employment_type IN ('full_time', 'part_time', 'contract')),
  reporting_manager_id UUID REFERENCES public.hr_employees(id),
  employment_status TEXT NOT NULL DEFAULT 'active' CHECK (employment_status IN ('active', 'on_leave', 'terminated', 'suspended', 'resigned')),
  deactivation_reason TEXT,
  deactivated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Employee documents
CREATE TABLE public.hr_employee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Employee education
CREATE TABLE public.hr_employee_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  qualification TEXT NOT NULL,
  college_name TEXT,
  year_of_passing TEXT,
  specialization TEXT,
  additional_certifications TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Employee bank details
CREATE TABLE public.hr_employee_bank_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  bank_name TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  branch_name TEXT,
  upi_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Employee insurance
CREATE TABLE public.hr_employee_insurance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  provider TEXT,
  policy_number TEXT,
  coverage_amount NUMERIC DEFAULT 0,
  policy_start DATE,
  policy_expiry DATE,
  additional_benefits TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Emergency contacts
CREATE TABLE public.hr_employee_emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  relationship TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Employee attendance
CREATE TABLE public.hr_employee_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  total_hours NUMERIC,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'leave')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_employee_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_employee_bank_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_employee_insurance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_employee_emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_employee_attendance ENABLE ROW LEVEL SECURITY;

-- Departments policies
CREATE POLICY "departments_select" ON public.departments FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "departments_insert" ON public.departments FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "departments_update" ON public.departments FOR UPDATE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "departments_delete" ON public.departments FOR DELETE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- HR employees policies (super_admin, business_admin, or hr_manager via manager role check)
CREATE POLICY "hr_employees_select" ON public.hr_employees FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "hr_employees_insert" ON public.hr_employees FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "hr_employees_update" ON public.hr_employees FOR UPDATE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "hr_employees_delete" ON public.hr_employees FOR DELETE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Documents policies
CREATE POLICY "hr_docs_select" ON public.hr_employee_documents FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "hr_docs_insert" ON public.hr_employee_documents FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "hr_docs_delete" ON public.hr_employee_documents FOR DELETE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Education, bank, insurance, emergency - select via employee join
CREATE POLICY "hr_edu_select" ON public.hr_employee_education FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.hr_employees e WHERE e.id = employee_id AND (e.business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))));
CREATE POLICY "hr_edu_insert" ON public.hr_employee_education FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.hr_employees e WHERE e.id = employee_id AND (e.business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))));
CREATE POLICY "hr_edu_update" ON public.hr_employee_education FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.hr_employees e WHERE e.id = employee_id AND (e.business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))));
CREATE POLICY "hr_edu_delete" ON public.hr_employee_education FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.hr_employees e WHERE e.id = employee_id AND (e.business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))));

CREATE POLICY "hr_bank_select" ON public.hr_employee_bank_details FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.hr_employees e WHERE e.id = employee_id AND (e.business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))));
CREATE POLICY "hr_bank_insert" ON public.hr_employee_bank_details FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.hr_employees e WHERE e.id = employee_id AND (e.business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))));
CREATE POLICY "hr_bank_update" ON public.hr_employee_bank_details FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.hr_employees e WHERE e.id = employee_id AND (e.business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))));

CREATE POLICY "hr_ins_select" ON public.hr_employee_insurance FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.hr_employees e WHERE e.id = employee_id AND (e.business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))));
CREATE POLICY "hr_ins_insert" ON public.hr_employee_insurance FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.hr_employees e WHERE e.id = employee_id AND (e.business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))));
CREATE POLICY "hr_ins_update" ON public.hr_employee_insurance FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.hr_employees e WHERE e.id = employee_id AND (e.business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))));

CREATE POLICY "hr_emg_select" ON public.hr_employee_emergency_contacts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.hr_employees e WHERE e.id = employee_id AND (e.business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))));
CREATE POLICY "hr_emg_insert" ON public.hr_employee_emergency_contacts FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.hr_employees e WHERE e.id = employee_id AND (e.business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))));
CREATE POLICY "hr_emg_update" ON public.hr_employee_emergency_contacts FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.hr_employees e WHERE e.id = employee_id AND (e.business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))));

-- Attendance policies
CREATE POLICY "hr_att_select" ON public.hr_employee_attendance FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "hr_att_insert" ON public.hr_employee_attendance FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "hr_att_update" ON public.hr_employee_attendance FOR UPDATE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Updated_at triggers
CREATE TRIGGER departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER hr_employees_updated_at BEFORE UPDATE ON public.hr_employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER hr_bank_updated_at BEFORE UPDATE ON public.hr_employee_bank_details FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for HR documents
INSERT INTO storage.buckets (id, name, public) VALUES ('hr-documents', 'hr-documents', false) ON CONFLICT DO NOTHING;

CREATE POLICY "hr_docs_storage_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'hr-documents');
CREATE POLICY "hr_docs_storage_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'hr-documents');
CREATE POLICY "hr_docs_storage_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'hr-documents');
CREATE POLICY "hr_docs_storage_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'hr-documents');
