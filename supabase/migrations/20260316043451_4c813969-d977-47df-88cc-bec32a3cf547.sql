
-- 1. Add business_model column to businesses table
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS business_model text DEFAULT NULL;

-- 2. Add onboarding_completed flag to businesses
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- 3. Department Templates Library
CREATE TABLE public.department_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text DEFAULT 'Building2',
  default_fields jsonb DEFAULT '[]'::jsonb,
  default_status_options jsonb DEFAULT '[]'::jsonb,
  default_reports jsonb DEFAULT '[]'::jsonb,
  default_permissions jsonb DEFAULT '[]'::jsonb,
  is_system boolean DEFAULT true,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.department_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can read templates" ON public.department_templates FOR SELECT TO authenticated USING (true);

-- 4. Department Field Templates
CREATE TABLE public.department_field_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_template_id uuid REFERENCES public.department_templates(id) ON DELETE CASCADE NOT NULL,
  field_label text NOT NULL,
  field_key text NOT NULL,
  field_type text DEFAULT 'text',
  is_default_enabled boolean DEFAULT true,
  is_required boolean DEFAULT false,
  display_order int DEFAULT 0,
  options jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.department_field_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can read field templates" ON public.department_field_templates FOR SELECT TO authenticated USING (true);

-- 5. Business Department Config (which departments a business has enabled + field overrides)
CREATE TABLE public.business_department_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  department_template_id uuid REFERENCES public.department_templates(id) NOT NULL,
  is_enabled boolean DEFAULT true,
  custom_fields jsonb DEFAULT '[]'::jsonb,
  field_overrides jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(business_id, department_template_id)
);

ALTER TABLE public.business_department_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own business dept config" ON public.business_department_config FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Super admins full access dept config" ON public.business_department_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- 6. Customization Requests
CREATE TABLE public.customization_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  department text,
  request_type text DEFAULT 'general',
  title text NOT NULL,
  description text,
  priority text DEFAULT 'medium',
  status text DEFAULT 'pending',
  assigned_to uuid,
  created_by uuid,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.customization_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own business customization requests" ON public.customization_requests FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Super admins full access customization requests" ON public.customization_requests FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- 7. Call Click Events
CREATE TABLE public.call_click_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  page_url text,
  phone_number text,
  device_type text,
  campaign_source text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.call_click_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own business call clicks" ON public.call_click_events FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Super admins full access call clicks" ON public.call_click_events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
-- Allow anonymous inserts for website tracking
CREATE POLICY "Anon can insert call clicks" ON public.call_click_events FOR INSERT TO anon WITH CHECK (true);

-- 8. App Module Settings
CREATE TABLE public.app_module_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  module_name text NOT NULL,
  enabled boolean DEFAULT true,
  visible_to_customer boolean DEFAULT true,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(business_id, module_name)
);

ALTER TABLE public.app_module_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own business app module settings" ON public.app_module_settings FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Super admins full access app module settings" ON public.app_module_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- 9. Usage Activity Logs
CREATE TABLE public.usage_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  activity_type text NOT NULL,
  module text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.usage_activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own activity" ON public.usage_activity_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can read business activity" ON public.usage_activity_logs FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Super admins full access activity logs" ON public.usage_activity_logs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- 10. Seed default department templates
INSERT INTO public.department_templates (name, description, icon, display_order, default_fields) VALUES
  ('Sales', 'Sales and business development', 'Target', 1, '[{"label":"Lead Name","key":"lead_name","type":"text"},{"label":"Phone","key":"phone","type":"text"},{"label":"Email","key":"email","type":"text"},{"label":"Service Requested","key":"service_requested","type":"text"},{"label":"Lead Status","key":"lead_status","type":"dropdown"},{"label":"Follow-up Date","key":"followup_date","type":"date"},{"label":"Assigned To","key":"assigned_to","type":"text"}]'),
  ('HR', 'Human resources management', 'Users', 2, '[{"label":"Employee Name","key":"employee_name","type":"text"},{"label":"Joining Date","key":"joining_date","type":"date"},{"label":"Department","key":"department","type":"text"},{"label":"Designation","key":"designation","type":"text"},{"label":"Salary Reference","key":"salary_reference","type":"text"},{"label":"Documents","key":"documents","type":"text"},{"label":"Performance Notes","key":"performance_notes","type":"text"}]'),
  ('Accounts', 'Finance and accounting', 'DollarSign', 3, '[{"label":"Invoice ID","key":"invoice_id","type":"text"},{"label":"Client Name","key":"client_name","type":"text"},{"label":"Invoice Amount","key":"invoice_amount","type":"number"},{"label":"Due Date","key":"due_date","type":"date"},{"label":"Payment Status","key":"payment_status","type":"dropdown"}]'),
  ('Operations', 'Day-to-day operations management', 'Settings', 4, '[]'),
  ('Customer Support', 'Customer service and support', 'Headphones', 5, '[]'),
  ('Marketing', 'Marketing and campaigns', 'Megaphone', 6, '[]'),
  ('SEO', 'Search engine optimization', 'Search', 7, '[]'),
  ('Advertising', 'Paid advertising management', 'BarChart3', 8, '[]'),
  ('Inventory', 'Stock and inventory management', 'Package', 9, '[]'),
  ('Service Delivery', 'Service fulfillment', 'Truck', 10, '[]'),
  ('Projects', 'Project management', 'FolderKanban', 11, '[]'),
  ('Admin', 'Administration', 'Shield', 12, '[]');

-- Seed field templates for Sales, HR, Accounts
INSERT INTO public.department_field_templates (department_template_id, field_label, field_key, field_type, display_order, is_required)
SELECT dt.id, 'Lead Name', 'lead_name', 'text', 1, true FROM public.department_templates dt WHERE dt.name = 'Sales'
UNION ALL
SELECT dt.id, 'Phone', 'phone', 'text', 2, true FROM public.department_templates dt WHERE dt.name = 'Sales'
UNION ALL
SELECT dt.id, 'Email', 'email', 'text', 3, false FROM public.department_templates dt WHERE dt.name = 'Sales'
UNION ALL
SELECT dt.id, 'Service Requested', 'service_requested', 'text', 4, false FROM public.department_templates dt WHERE dt.name = 'Sales'
UNION ALL
SELECT dt.id, 'Lead Status', 'lead_status', 'dropdown', 5, true FROM public.department_templates dt WHERE dt.name = 'Sales'
UNION ALL
SELECT dt.id, 'Follow-up Date', 'followup_date', 'date', 6, false FROM public.department_templates dt WHERE dt.name = 'Sales'
UNION ALL
SELECT dt.id, 'Employee Name', 'employee_name', 'text', 1, true FROM public.department_templates dt WHERE dt.name = 'HR'
UNION ALL
SELECT dt.id, 'Joining Date', 'joining_date', 'date', 2, true FROM public.department_templates dt WHERE dt.name = 'HR'
UNION ALL
SELECT dt.id, 'Department', 'department', 'text', 3, true FROM public.department_templates dt WHERE dt.name = 'HR'
UNION ALL
SELECT dt.id, 'Designation', 'designation', 'text', 4, false FROM public.department_templates dt WHERE dt.name = 'HR'
UNION ALL
SELECT dt.id, 'Salary Reference', 'salary_reference', 'text', 5, false FROM public.department_templates dt WHERE dt.name = 'HR'
UNION ALL
SELECT dt.id, 'Invoice ID', 'invoice_id', 'text', 1, true FROM public.department_templates dt WHERE dt.name = 'Accounts'
UNION ALL
SELECT dt.id, 'Client Name', 'client_name', 'text', 2, true FROM public.department_templates dt WHERE dt.name = 'Accounts'
UNION ALL
SELECT dt.id, 'Invoice Amount', 'invoice_amount', 'number', 3, true FROM public.department_templates dt WHERE dt.name = 'Accounts'
UNION ALL
SELECT dt.id, 'Due Date', 'due_date', 'date', 4, false FROM public.department_templates dt WHERE dt.name = 'Accounts'
UNION ALL
SELECT dt.id, 'Payment Status', 'payment_status', 'dropdown', 5, true FROM public.department_templates dt WHERE dt.name = 'Accounts';
