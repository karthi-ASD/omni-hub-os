
-- =====================================================
-- STAGE 16: Workforce Management + Employee Monitoring
-- =====================================================

-- Storage bucket for employee documents
INSERT INTO storage.buckets (id, name, public) VALUES ('employee-documents', 'employee-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for employee documents
CREATE POLICY "Employees can view own docs" ON storage.objects FOR SELECT
  USING (bucket_id = 'employee-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Authenticated users can upload docs" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'employee-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can view all employee docs" ON storage.objects FOR SELECT
  USING (bucket_id = 'employee-documents' AND (
    public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'business_admin')
  ));

-- =====================================================
-- A) Employee Profiles
-- =====================================================
CREATE TABLE public.employee_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  employee_code TEXT,
  manager_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  department_id UUID,
  team_id UUID,
  employment_type TEXT NOT NULL DEFAULT 'full_time' CHECK (employment_type IN ('full_time','part_time','contract')),
  work_location_type TEXT NOT NULL DEFAULT 'office' CHECK (work_location_type IN ('office','remote','hybrid')),
  date_of_joining DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','onboarding','terminated')),
  emergency_contact_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees view own profile" ON public.employee_profiles FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Admins manage employee profiles" ON public.employee_profiles FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR (
    public.has_role(auth.uid(), 'business_admin') AND business_id = public.get_user_business_id(auth.uid())
  ));

-- =====================================================
-- Employee Documents
-- =====================================================
CREATE TABLE public.employee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('photo','id_proof','address_proof','contract','nda','other')),
  file_url TEXT NOT NULL,
  document_meta_json JSONB,
  verified_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees view own docs" ON public.employee_documents FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Admins manage employee docs" ON public.employee_documents FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR (
    public.has_role(auth.uid(), 'business_admin') AND business_id = public.get_user_business_id(auth.uid())
  ));

-- =====================================================
-- B) Login/Logoff Sessions
-- =====================================================
CREATE TABLE public.employee_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  login_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  logout_at TIMESTAMPTZ,
  session_duration_minutes INT,
  ip_address TEXT,
  device_info_json JSONB,
  login_method TEXT NOT NULL DEFAULT 'password',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees view own sessions" ON public.employee_sessions FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Admins manage sessions" ON public.employee_sessions FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR (
    public.has_role(auth.uid(), 'business_admin') AND business_id = public.get_user_business_id(auth.uid())
  ));

-- =====================================================
-- Attendance Daily
-- =====================================================
CREATE TABLE public.attendance_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  first_login_at TIMESTAMPTZ,
  last_logout_at TIMESTAMPTZ,
  total_work_minutes INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present','absent','half_day','leave','holiday')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.attendance_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees view own attendance" ON public.attendance_daily FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Admins manage attendance" ON public.attendance_daily FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR (
    public.has_role(auth.uid(), 'business_admin') AND business_id = public.get_user_business_id(auth.uid())
  ));

-- =====================================================
-- Attendance Checkins (GPS optional)
-- =====================================================
CREATE TABLE public.attendance_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  checkin_type TEXT NOT NULL CHECK (checkin_type IN ('in','out')),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location_label TEXT,
  source TEXT NOT NULL DEFAULT 'web' CHECK (source IN ('web','mobile')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.attendance_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees manage own checkins" ON public.attendance_checkins FOR ALL
  USING (user_id = auth.uid());
CREATE POLICY "Admins view checkins" ON public.attendance_checkins FOR SELECT
  USING (public.has_role(auth.uid(), 'super_admin') OR (
    public.has_role(auth.uid(), 'business_admin') AND business_id = public.get_user_business_id(auth.uid())
  ));

-- =====================================================
-- D) SLA Policies
-- =====================================================
CREATE TABLE public.sla_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('ticket','task')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  first_response_minutes INT NOT NULL DEFAULT 60,
  resolution_minutes INT NOT NULL DEFAULT 480,
  escalation_levels_json JSONB DEFAULT '["manager","department_head","ceo"]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sla_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage SLA policies" ON public.sla_policies FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR (
    public.has_role(auth.uid(), 'business_admin') AND business_id = public.get_user_business_id(auth.uid())
  ));

-- =====================================================
-- SLA Events
-- =====================================================
CREATE TABLE public.sla_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('due_soon','breached','escalated','resolved')),
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  triggered_to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sla_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view SLA events" ON public.sla_events FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR (
    public.has_role(auth.uid(), 'business_admin') AND business_id = public.get_user_business_id(auth.uid())
  ));

-- =====================================================
-- E) Completion Notifications
-- =====================================================
CREATE TABLE public.completion_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('client','customer')),
  channel TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('email','whatsapp','sms')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.completion_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage completion notifications" ON public.completion_notifications FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR (
    public.has_role(auth.uid(), 'business_admin') AND business_id = public.get_user_business_id(auth.uid())
  ));

-- =====================================================
-- F) Leave Types
-- =====================================================
CREATE TABLE public.leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  annual_quota_days INT NOT NULL DEFAULT 20,
  carry_forward_rules_json JSONB,
  requires_documents BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users view leave types" ON public.leave_types FOR SELECT
  USING (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Admins manage leave types" ON public.leave_types FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR (
    public.has_role(auth.uid(), 'business_admin') AND business_id = public.get_user_business_id(auth.uid())
  ));

-- =====================================================
-- Leave Requests
-- =====================================================
CREATE TABLE public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  leave_type_id UUID REFERENCES public.leave_types(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees manage own leave" ON public.leave_requests FOR ALL
  USING (user_id = auth.uid());
CREATE POLICY "Admins manage all leave" ON public.leave_requests FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR (
    public.has_role(auth.uid(), 'business_admin') AND business_id = public.get_user_business_id(auth.uid())
  ));

-- =====================================================
-- G) Salary Profiles
-- =====================================================
CREATE TABLE public.salary_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  pay_frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (pay_frequency IN ('monthly','weekly','fortnightly')),
  base_salary NUMERIC(12,2) NOT NULL DEFAULT 0,
  allowances_json JSONB,
  deductions_json JSONB,
  bank_details_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.salary_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees view own salary" ON public.salary_profiles FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Admins manage salaries" ON public.salary_profiles FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR (
    public.has_role(auth.uid(), 'business_admin') AND business_id = public.get_user_business_id(auth.uid())
  ));

-- =====================================================
-- Payslips
-- =====================================================
CREATE TABLE public.payslips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  period_month TEXT NOT NULL,
  gross_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  payslip_file_url TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees view own payslips" ON public.payslips FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Admins manage payslips" ON public.payslips FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR (
    public.has_role(auth.uid(), 'business_admin') AND business_id = public.get_user_business_id(auth.uid())
  ));

-- =====================================================
-- H) Org Structure Nodes
-- =====================================================
CREATE TABLE public.org_structure_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  node_type TEXT NOT NULL CHECK (node_type IN ('department','team','role')),
  name TEXT NOT NULL,
  parent_node_id UUID REFERENCES public.org_structure_nodes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.org_structure_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users view org" ON public.org_structure_nodes FOR SELECT
  USING (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Admins manage org" ON public.org_structure_nodes FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR (
    public.has_role(auth.uid(), 'business_admin') AND business_id = public.get_user_business_id(auth.uid())
  ));

-- Add FK for employee_profiles department/team
ALTER TABLE public.employee_profiles 
  ADD CONSTRAINT fk_employee_department FOREIGN KEY (department_id) REFERENCES public.org_structure_nodes(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_employee_team FOREIGN KEY (team_id) REFERENCES public.org_structure_nodes(id) ON DELETE SET NULL;

-- =====================================================
-- Re-attach critical triggers (they get lost between migrations)
-- =====================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_user_created();

DROP TRIGGER IF EXISTS on_business_change ON public.businesses;
CREATE TRIGGER on_business_change
  AFTER INSERT OR UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.notify_business_status_change();
