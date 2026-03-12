
-- Extend businesses table with full registration fields
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS owner_name text,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS postcode text,
ADD COLUMN IF NOT EXISTS website_url text,
ADD COLUMN IF NOT EXISTS domain_name text,
ADD COLUMN IF NOT EXISTS hosting_provider text,
ADD COLUMN IF NOT EXISTS cms_platform text,
ADD COLUMN IF NOT EXISTS social_facebook text,
ADD COLUMN IF NOT EXISTS social_instagram text,
ADD COLUMN IF NOT EXISTS social_linkedin text,
ADD COLUMN IF NOT EXISTS social_gbp text,
ADD COLUMN IF NOT EXISTS social_youtube text,
ADD COLUMN IF NOT EXISTS industry text,
ADD COLUMN IF NOT EXISTS sub_industry text,
ADD COLUMN IF NOT EXISTS services_offered text[],
ADD COLUMN IF NOT EXISTS target_locations text[],
ADD COLUMN IF NOT EXISTS competitors text[],
ADD COLUMN IF NOT EXISTS subscribed_services text[],
ADD COLUMN IF NOT EXISTS registration_method text DEFAULT 'self',
ADD COLUMN IF NOT EXISTS registered_by_user_id uuid;

-- Sub-customers table (Level 4 hierarchy)
CREATE TABLE IF NOT EXISTS public.sub_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.tenant_customers(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  role text DEFAULT 'staff',
  status text DEFAULT 'active',
  user_id uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.sub_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sub_customers_tenant_isolation" ON public.sub_customers
FOR ALL USING (
  business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'super_admin')
);

-- OTP verifications table
CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  otp_code text NOT NULL,
  otp_type text NOT NULL DEFAULT 'mobile',
  phone text,
  email text,
  verified boolean DEFAULT false,
  expires_at timestamptz NOT NULL,
  attempts int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "otp_own_records" ON public.otp_verifications
FOR ALL USING (user_id = auth.uid());

-- First login security tracking
CREATE TABLE IF NOT EXISTS public.first_login_security (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email_verified boolean DEFAULT false,
  mobile_verified boolean DEFAULT false,
  password_changed boolean DEFAULT false,
  requires_security_setup boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);
ALTER TABLE public.first_login_security ENABLE ROW LEVEL SECURITY;

CREATE POLICY "first_login_own_record" ON public.first_login_security
FOR ALL USING (user_id = auth.uid());

-- Business registration function (for admin/sales team creation)
CREATE OR REPLACE FUNCTION public.handle_business_registration(
  _business_name text,
  _owner_name text,
  _email text,
  _phone text,
  _address text DEFAULT NULL,
  _city text DEFAULT NULL,
  _state text DEFAULT NULL,
  _country text DEFAULT NULL,
  _postcode text DEFAULT NULL,
  _website_url text DEFAULT NULL,
  _domain_name text DEFAULT NULL,
  _hosting_provider text DEFAULT NULL,
  _cms_platform text DEFAULT NULL,
  _social_facebook text DEFAULT NULL,
  _social_instagram text DEFAULT NULL,
  _social_linkedin text DEFAULT NULL,
  _social_gbp text DEFAULT NULL,
  _social_youtube text DEFAULT NULL,
  _industry text DEFAULT NULL,
  _sub_industry text DEFAULT NULL,
  _services_offered text[] DEFAULT NULL,
  _target_locations text[] DEFAULT NULL,
  _competitors text[] DEFAULT NULL,
  _subscribed_services text[] DEFAULT NULL,
  _registration_method text DEFAULT 'self',
  _registered_by_user_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _business_id UUID;
BEGIN
  INSERT INTO public.businesses (
    name, owner_name, email, phone, address, city, state, country, postcode,
    website_url, domain_name, hosting_provider, cms_platform,
    social_facebook, social_instagram, social_linkedin, social_gbp, social_youtube,
    industry, sub_industry, services_offered, target_locations, competitors,
    subscribed_services, registration_method, registered_by_user_id
  ) VALUES (
    _business_name, _owner_name, _email, _phone, _address, _city, _state, _country, _postcode,
    _website_url, _domain_name, _hosting_provider, _cms_platform,
    _social_facebook, _social_instagram, _social_linkedin, _social_gbp, _social_youtube,
    _industry, _sub_industry, _services_offered, _target_locations, _competitors,
    _subscribed_services, _registration_method, _registered_by_user_id
  ) RETURNING id INTO _business_id;

  INSERT INTO public.system_events (business_id, event_type, payload_json)
  VALUES (_business_id, 'BUSINESS_REGISTERED', jsonb_build_object(
    'business_name', _business_name,
    'email', _email,
    'method', _registration_method
  ));

  RETURN _business_id;
END;
$$;

-- Enhanced signup function that includes all business fields
CREATE OR REPLACE FUNCTION public.handle_full_signup(
  _user_id uuid,
  _business_name text,
  _email text,
  _owner_name text DEFAULT NULL,
  _phone text DEFAULT NULL,
  _address text DEFAULT NULL,
  _city text DEFAULT NULL,
  _state text DEFAULT NULL,
  _country text DEFAULT NULL,
  _postcode text DEFAULT NULL,
  _website_url text DEFAULT NULL,
  _domain_name text DEFAULT NULL,
  _hosting_provider text DEFAULT NULL,
  _cms_platform text DEFAULT NULL,
  _social_facebook text DEFAULT NULL,
  _social_instagram text DEFAULT NULL,
  _social_linkedin text DEFAULT NULL,
  _social_gbp text DEFAULT NULL,
  _social_youtube text DEFAULT NULL,
  _industry text DEFAULT NULL,
  _sub_industry text DEFAULT NULL,
  _services_offered text[] DEFAULT NULL,
  _target_locations text[] DEFAULT NULL,
  _competitors text[] DEFAULT NULL,
  _subscribed_services text[] DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _business_id UUID;
BEGIN
  INSERT INTO public.businesses (
    name, owner_name, email, phone, address, city, state, country, postcode,
    website_url, domain_name, hosting_provider, cms_platform,
    social_facebook, social_instagram, social_linkedin, social_gbp, social_youtube,
    industry, sub_industry, services_offered, target_locations, competitors,
    subscribed_services, registration_method
  ) VALUES (
    _business_name, _owner_name, _email, _phone, _address, _city, _state, _country, _postcode,
    _website_url, _domain_name, _hosting_provider, _cms_platform,
    _social_facebook, _social_instagram, _social_linkedin, _social_gbp, _social_youtube,
    _industry, _sub_industry, _services_offered, _target_locations, _competitors,
    _subscribed_services, 'self'
  ) RETURNING id INTO _business_id;

  UPDATE public.profiles
  SET business_id = _business_id, full_name = COALESCE(_owner_name, (SELECT full_name FROM public.profiles WHERE user_id = _user_id))
  WHERE user_id = _user_id;

  INSERT INTO public.user_roles (user_id, role, business_id)
  VALUES (_user_id, 'business_admin', _business_id);

  INSERT INTO public.settings (business_id, key, value)
  VALUES
    (_business_id, 'timezone', 'Australia/Sydney'),
    (_business_id, 'currency', 'AUD'),
    (_business_id, 'date_format', 'DD/MM/YYYY'),
    (_business_id, 'theme', 'system');

  INSERT INTO public.system_events (business_id, event_type, payload_json)
  VALUES (_business_id, 'SIGNUP', jsonb_build_object('email', _email, 'business_name', _business_name));

  INSERT INTO public.audit_logs (business_id, actor_user_id, action_type, entity_type, entity_id, new_value_json)
  VALUES (_business_id, _user_id, 'CREATE_BUSINESS', 'business', _business_id::text, jsonb_build_object('name', _business_name));

  RETURN _business_id;
END;
$$;
