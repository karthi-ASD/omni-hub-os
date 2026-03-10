
-- SaaS Plans table
CREATE TABLE public.saas_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  monthly_price numeric NOT NULL DEFAULT 0,
  yearly_price numeric NOT NULL DEFAULT 0,
  user_limit integer NOT NULL DEFAULT 5,
  project_limit integer NOT NULL DEFAULT 10,
  storage_limit_gb integer NOT NULL DEFAULT 1,
  features_json jsonb DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.saas_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active plans" ON public.saas_plans
  FOR SELECT USING (is_active = true);

CREATE POLICY "Super admins manage plans" ON public.saas_plans
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Subscriptions table
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.saas_plans(id),
  status text NOT NULL DEFAULT 'trial',
  billing_cycle text NOT NULL DEFAULT 'monthly',
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancelled_at timestamptz,
  stripe_subscription_id text,
  stripe_customer_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(business_id)
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage subscriptions" ON public.subscriptions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Business admins read own subscription" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (
    business_id IN (
      SELECT p.business_id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
  );

-- White-label settings
CREATE TABLE public.white_label_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE UNIQUE,
  custom_logo_url text,
  custom_favicon_url text,
  primary_color text DEFAULT '#6366f1',
  secondary_color text DEFAULT '#8b5cf6',
  company_display_name text,
  custom_domain text,
  domain_verified boolean NOT NULL DEFAULT false,
  hide_platform_branding boolean NOT NULL DEFAULT false,
  login_page_html text,
  email_footer_html text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.white_label_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage white label" ON public.white_label_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Business admins manage own white label" ON public.white_label_settings
  FOR ALL TO authenticated
  USING (
    business_id IN (
      SELECT p.business_id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
    AND public.has_role(auth.uid(), 'business_admin')
  )
  WITH CHECK (
    business_id IN (
      SELECT p.business_id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
    AND public.has_role(auth.uid(), 'business_admin')
  );

-- Seed default plans
INSERT INTO public.saas_plans (name, slug, description, monthly_price, yearly_price, user_limit, project_limit, storage_limit_gb, features_json, sort_order) VALUES
('Starter', 'starter', 'For small businesses getting started', 29, 290, 5, 10, 1, '["Basic CRM","Task Management","Reports"]', 1),
('Pro', 'pro', 'For growing agencies', 79, 790, 20, 50, 10, '["Full CRM","Project Management","Department Tasks","Reports & Analytics","Email Integration"]', 2),
('Agency', 'agency', 'For digital marketing agencies', 199, 1990, -1, -1, 100, '["Unlimited Users","Unlimited Projects","Agency Command Center","HR Management","AI Task Distribution","Client Portals","Advanced Reporting","White-Label","Custom Domain"]', 3);
