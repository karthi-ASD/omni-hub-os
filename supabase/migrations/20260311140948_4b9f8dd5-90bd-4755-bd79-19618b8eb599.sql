
-- Client Departments
CREATE TABLE public.client_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  department_name TEXT NOT NULL,
  manager_name TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_client_departments_client ON public.client_departments(client_id);

-- Client Employees
CREATE TABLE public.client_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.client_departments(id) ON DELETE SET NULL,
  employee_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  designation TEXT,
  joining_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  app_access BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_client_employees_client ON public.client_employees(client_id);
CREATE INDEX idx_client_employees_dept ON public.client_employees(department_id);

-- RLS
ALTER TABLE public.client_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_employees ENABLE ROW LEVEL SECURITY;

-- Business users can manage their own client departments
CREATE POLICY "Business users manage client departments" ON public.client_departments
  FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

-- Business users can manage their own client employees
CREATE POLICY "Business users manage client employees" ON public.client_employees
  FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

-- Updated_at triggers
CREATE TRIGGER update_client_departments_updated_at
  BEFORE UPDATE ON public.client_departments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_employees_updated_at
  BEFORE UPDATE ON public.client_employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
