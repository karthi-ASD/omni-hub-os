
-- =====================================================
-- NEXTWEB OS — STAGE 1 DATABASE SCHEMA
-- =====================================================

-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'business_admin', 'manager', 'employee', 'client');

-- Create business_status enum
CREATE TYPE public.business_status AS ENUM ('active', 'suspended', 'cancelled');

-- Create integration_provider enum
CREATE TYPE public.integration_provider AS ENUM ('xero', 'stripe', 'eway', 'whatsapp', 'sms', 'google');

-- Create integration_status enum
CREATE TYPE public.integration_status AS ENUM ('active', 'inactive', 'error');

-- =====================================================
-- 1) BUSINESSES (tenants)
-- =====================================================
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status public.business_status NOT NULL DEFAULT 'active',
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2) PROFILES (extends auth.users)
-- =====================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  is_email_verified BOOLEAN NOT NULL DEFAULT false,
  failed_login_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_business_id ON public.profiles(business_id);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3) USER_ROLES (separate table per security rules)
-- =====================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_business_id ON public.user_roles(business_id);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4) AUDIT_LOGS
-- =====================================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  old_value_json JSONB,
  new_value_json JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_business_id_created ON public.audit_logs(business_id, created_at DESC);
CREATE INDEX idx_audit_logs_actor ON public.audit_logs(actor_user_id);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5) SETTINGS (key/value per tenant)
-- =====================================================
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, key)
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6) INTEGRATIONS (encrypted secrets placeholder)
-- =====================================================
CREATE TABLE public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  provider public.integration_provider NOT NULL,
  credentials_encrypted_json TEXT,
  status public.integration_status NOT NULL DEFAULT 'inactive',
  last_health_check_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7) SYSTEM_EVENTS
-- =====================================================
CREATE TABLE public.system_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  payload_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_system_events_business ON public.system_events(business_id, created_at DESC);

ALTER TABLE public.system_events ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 8) AUTOMATION_RULES (placeholder)
-- =====================================================
CREATE TABLE public.automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_event_type TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  config_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 9) AUTOMATION_RUNS (placeholder)
-- =====================================================
CREATE TABLE public.automation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.system_events(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  logs_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SECURITY DEFINER FUNCTION: has_role
-- =====================================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- =====================================================
-- SECURITY DEFINER: get_user_business_id
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_user_business_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT business_id FROM public.profiles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- =====================================================
-- TIMESTAMP TRIGGER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply timestamp triggers
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON public.integrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_automation_rules_updated_at BEFORE UPDATE ON public.automation_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- PROFILE AUTO-CREATE TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- BUSINESSES
CREATE POLICY "Super admins can manage all businesses"
  ON public.businesses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Business admins can view own business"
  ON public.businesses FOR SELECT TO authenticated
  USING (id = public.get_user_business_id(auth.uid()));

-- PROFILES
CREATE POLICY "Super admins can manage all profiles"
  ON public.profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Business admins can view tenant profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'business_admin')
    AND business_id = public.get_user_business_id(auth.uid())
  );

CREATE POLICY "Business admins can manage tenant profiles"
  ON public.profiles FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'business_admin')
    AND business_id = public.get_user_business_id(auth.uid())
  );

-- USER_ROLES
CREATE POLICY "Super admins can manage all roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Business admins can manage tenant roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'business_admin')
    AND business_id = public.get_user_business_id(auth.uid())
  );

-- AUDIT_LOGS
CREATE POLICY "Super admins can view all audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Business admins can view tenant audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'business_admin')
    AND business_id = public.get_user_business_id(auth.uid())
  );

CREATE POLICY "Authenticated users can insert audit logs"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- SETTINGS
CREATE POLICY "Super admins can manage all settings"
  ON public.settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Business admins can manage tenant settings"
  ON public.settings FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'business_admin')
    AND business_id = public.get_user_business_id(auth.uid())
  );

-- INTEGRATIONS
CREATE POLICY "Super admins can manage all integrations"
  ON public.integrations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Business admins can manage tenant integrations"
  ON public.integrations FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'business_admin')
    AND business_id = public.get_user_business_id(auth.uid())
  );

-- SYSTEM_EVENTS
CREATE POLICY "Super admins can view all events"
  ON public.system_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Business admins can view tenant events"
  ON public.system_events FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'business_admin')
    AND business_id = public.get_user_business_id(auth.uid())
  );

CREATE POLICY "Authenticated users can insert events"
  ON public.system_events FOR INSERT TO authenticated
  WITH CHECK (true);

-- AUTOMATION_RULES
CREATE POLICY "Super admins can manage all automation rules"
  ON public.automation_rules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Business admins can manage tenant automation rules"
  ON public.automation_rules FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'business_admin')
    AND business_id = public.get_user_business_id(auth.uid())
  );

-- AUTOMATION_RUNS
CREATE POLICY "Super admins can manage all automation runs"
  ON public.automation_runs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Business admins can view tenant automation runs"
  ON public.automation_runs FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'business_admin')
    AND business_id = public.get_user_business_id(auth.uid())
  );
