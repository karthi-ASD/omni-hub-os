
-- =====================================================
-- STAGE 17: Client 360, Vault, Job CRM, Usage Analytics
-- =====================================================

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('job-media', 'job-media', false) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Auth users upload job media" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'job-media' AND auth.role() = 'authenticated');
CREATE POLICY "Auth users view job media" ON storage.objects FOR SELECT
  USING (bucket_id = 'job-media' AND auth.role() = 'authenticated');

-- =====================================================
-- A) Client Profiles (Client 360)
-- =====================================================
CREATE TABLE public.client_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  legal_name TEXT,
  primary_contact_json JSONB,
  address_json JSONB,
  payment_profile_json JSONB, -- token/last4/brand only, NO raw cards
  service_packages_json JSONB,
  assigned_sales_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_pm_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_support_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contract_json JSONB,
  onboarding_status TEXT NOT NULL DEFAULT 'pending' CHECK (onboarding_status IN ('pending','in_progress','completed','on_hold')),
  renewal_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage client profiles" ON public.client_profiles FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR (
    public.has_role(auth.uid(), 'business_admin') AND business_id = public.get_user_business_id(auth.uid())
  ));

-- =====================================================
-- B) Secure Vault
-- =====================================================
CREATE TABLE public.vault_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  scope TEXT NOT NULL DEFAULT 'platform_only' CHECK (scope IN ('platform_only','tenant_only')),
  category TEXT NOT NULL CHECK (category IN ('hosting','domain','dns','email','analytics','ads','app_store','other')),
  title TEXT NOT NULL,
  username TEXT,
  secret_encrypted TEXT, -- encrypted at rest
  url TEXT,
  notes TEXT,
  visibility_role_min TEXT NOT NULL DEFAULT 'super_admin',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vault_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage vault" ON public.vault_items FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR (
    public.has_role(auth.uid(), 'business_admin') AND business_id = public.get_user_business_id(auth.uid())
  ));

CREATE TABLE public.vault_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_item_id UUID REFERENCES public.vault_items(id) ON DELETE CASCADE NOT NULL,
  accessed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('view','copy','download')),
  ip_address TEXT,
  device_info_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vault_access_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view vault logs" ON public.vault_access_logs FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'business_admin'));

-- =====================================================
-- C) Onboarding Workflows
-- =====================================================
CREATE TABLE public.onboarding_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  service_type TEXT NOT NULL,
  steps_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.onboarding_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage onboarding templates" ON public.onboarding_templates FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'business_admin'));

CREATE TABLE public.onboarding_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','blocked')),
  assigned_owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.onboarding_instances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage onboarding instances" ON public.onboarding_instances FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR (
    public.has_role(auth.uid(), 'business_admin') AND business_id = public.get_user_business_id(auth.uid())
  ));

CREATE TABLE public.onboarding_step_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_instance_id UUID REFERENCES public.onboarding_instances(id) ON DELETE CASCADE NOT NULL,
  step_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','blocked')),
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.onboarding_step_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage onboarding steps" ON public.onboarding_step_items FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'business_admin'));

-- =====================================================
-- D) Tenant Job / Field-Service CRM
-- =====================================================
CREATE TABLE public.tenant_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address_json JSONB,
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tenant_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant users manage customers" ON public.tenant_customers FOR ALL
  USING (business_id = public.get_user_business_id(auth.uid()));

CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  tenant_customer_id UUID REFERENCES public.tenant_customers(id) ON DELETE SET NULL,
  job_title TEXT NOT NULL,
  description TEXT,
  scheduled_start_at TIMESTAMPTZ,
  scheduled_end_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','confirmed','assigned','in_progress','completed','cancelled')),
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant users manage jobs" ON public.jobs FOR ALL
  USING (business_id = public.get_user_business_id(auth.uid()));

CREATE TABLE public.job_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  assigned_employee_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.job_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant users manage assignments" ON public.job_assignments FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.business_id = public.get_user_business_id(auth.uid())
  ));

CREATE TABLE public.job_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('before_photo','after_photo','signature','other')),
  file_url TEXT NOT NULL,
  uploaded_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.job_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant users manage job media" ON public.job_media FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.business_id = public.get_user_business_id(auth.uid())
  ));

CREATE TABLE public.job_renewal_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  service_type TEXT NOT NULL,
  renewal_interval_days INT NOT NULL DEFAULT 90,
  message_template_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.job_renewal_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage renewal rules" ON public.job_renewal_rules FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR (
    public.has_role(auth.uid(), 'business_admin') AND business_id = public.get_user_business_id(auth.uid())
  ));

CREATE TABLE public.job_renewal_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  tenant_customer_id UUID REFERENCES public.tenant_customers(id) ON DELETE SET NULL,
  next_due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','sent','completed','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.job_renewal_instances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant manage renewals" ON public.job_renewal_instances FOR ALL
  USING (business_id = public.get_user_business_id(auth.uid()));

-- =====================================================
-- E) Usage Analytics
-- =====================================================
CREATE TABLE public.usage_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  app_type TEXT NOT NULL DEFAULT 'web' CHECK (app_type IN ('web','mobile')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_seconds INT,
  device_info_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.usage_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view usage sessions" ON public.usage_sessions FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR (
    public.has_role(auth.uid(), 'business_admin') AND business_id = public.get_user_business_id(auth.uid())
  ));
CREATE POLICY "Users create own sessions" ON public.usage_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE TABLE public.usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  event_meta_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view usage events" ON public.usage_events FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR (
    public.has_role(auth.uid(), 'business_admin') AND business_id = public.get_user_business_id(auth.uid())
  ));
CREATE POLICY "Users create own events" ON public.usage_events FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- F) Auto-Reply + Voice Call Jobs
-- =====================================================
CREATE TABLE public.auto_reply_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email','whatsapp')),
  trigger_type TEXT NOT NULL DEFAULT 'new_inquiry',
  template_id UUID,
  enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.auto_reply_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage auto reply" ON public.auto_reply_rules FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR (
    public.has_role(auth.uid(), 'business_admin') AND business_id = public.get_user_business_id(auth.uid())
  ));

CREATE TABLE public.voice_call_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  inquiry_id UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','failed')),
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  transcript_url TEXT,
  outcome_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.voice_call_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage voice calls" ON public.voice_call_jobs FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR (
    public.has_role(auth.uid(), 'business_admin') AND business_id = public.get_user_business_id(auth.uid())
  ));

-- =====================================================
-- H) Review Requests
-- =====================================================
CREATE TABLE public.review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  tenant_customer_id UUID REFERENCES public.tenant_customers(id) ON DELETE SET NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','clicked','completed')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant manage reviews" ON public.review_requests FOR ALL
  USING (business_id = public.get_user_business_id(auth.uid()));

-- =====================================================
-- Re-attach triggers
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
