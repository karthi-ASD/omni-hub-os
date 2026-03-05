
-- Stage 29: Lead Distribution Engine + Website Domain/API Key Governance + Services Catalog

-- 1) tenant_websites table
CREATE TABLE public.tenant_websites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  website_name text NOT NULL,
  domain text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','disabled')),
  api_key_hash text,
  api_key_last4 text,
  created_by uuid,
  approved_by uuid,
  approved_at timestamptz,
  call_allowed_start_time time DEFAULT '09:00',
  call_allowed_end_time time DEFAULT '17:00',
  timezone text DEFAULT 'Australia/Sydney',
  default_lead_owner_employee_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(business_id, domain)
);

ALTER TABLE public.tenant_websites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_websites_select" ON public.tenant_websites FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin') OR
    business_id = public.get_user_business_id(auth.uid())
  );

CREATE POLICY "tenant_websites_insert" ON public.tenant_websites FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin') OR
    (business_id = public.get_user_business_id(auth.uid()) AND (public.has_role(auth.uid(), 'business_admin')))
  );

CREATE POLICY "tenant_websites_update" ON public.tenant_websites FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin') OR
    (business_id = public.get_user_business_id(auth.uid()) AND public.has_role(auth.uid(), 'business_admin'))
  );

CREATE POLICY "tenant_websites_delete" ON public.tenant_websites FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- 2) website_services table
CREATE TABLE public.website_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  website_id uuid NOT NULL REFERENCES public.tenant_websites(id) ON DELETE CASCADE,
  service_name text NOT NULL,
  service_category text,
  service_description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.website_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "website_services_select" ON public.website_services FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin') OR
    business_id = public.get_user_business_id(auth.uid())
  );

CREATE POLICY "website_services_manage" ON public.website_services FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin') OR
    (business_id = public.get_user_business_id(auth.uid()) AND public.has_role(auth.uid(), 'business_admin'))
  );

-- 3) lead_assignment_rules table
CREATE TYPE public.lead_assignment_mode AS ENUM ('round_robin','territory','priority','ai_score','manual');

CREATE TABLE public.lead_assignment_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  website_id uuid REFERENCES public.tenant_websites(id) ON DELETE SET NULL,
  rule_name text NOT NULL,
  mode public.lead_assignment_mode NOT NULL DEFAULT 'round_robin',
  is_active boolean NOT NULL DEFAULT true,
  config_json jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_assignment_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_assignment_rules_select" ON public.lead_assignment_rules FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin') OR
    business_id = public.get_user_business_id(auth.uid())
  );

CREATE POLICY "lead_assignment_rules_manage" ON public.lead_assignment_rules FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin') OR
    (business_id = public.get_user_business_id(auth.uid()) AND (public.has_role(auth.uid(), 'business_admin')))
  );

-- 4) employee_capacity table
CREATE TABLE public.employee_capacity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL,
  daily_lead_limit int NOT NULL DEFAULT 30,
  current_assigned_today int NOT NULL DEFAULT 0,
  last_reset_date date NOT NULL DEFAULT CURRENT_DATE,
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE(business_id, employee_id)
);

ALTER TABLE public.employee_capacity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employee_capacity_select" ON public.employee_capacity FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin') OR
    business_id = public.get_user_business_id(auth.uid())
  );

CREATE POLICY "employee_capacity_manage" ON public.employee_capacity FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin') OR
    (business_id = public.get_user_business_id(auth.uid()) AND public.has_role(auth.uid(), 'business_admin'))
  );

-- 5) lead_assignment_logs table
CREATE TABLE public.lead_assignment_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL,
  from_employee_id uuid,
  to_employee_id uuid NOT NULL,
  assigned_by text NOT NULL DEFAULT 'SYSTEM' CHECK (assigned_by IN ('SYSTEM','SUPERADMIN','TENANT_ADMIN')),
  rule_id uuid REFERENCES public.lead_assignment_rules(id) ON DELETE SET NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_assignment_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_assignment_logs_select" ON public.lead_assignment_logs FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin') OR
    business_id = public.get_user_business_id(auth.uid())
  );

CREATE POLICY "lead_assignment_logs_insert" ON public.lead_assignment_logs FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin') OR
    business_id = public.get_user_business_id(auth.uid())
  );

-- 6) Add columns to leads table
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS website_id uuid REFERENCES public.tenant_websites(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS service_detected text,
  ADD COLUMN IF NOT EXISTS assignment_mode text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS assignment_reason text,
  ADD COLUMN IF NOT EXISTS locked_fields jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;

-- 7) Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.tenant_websites;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_assignment_logs;
