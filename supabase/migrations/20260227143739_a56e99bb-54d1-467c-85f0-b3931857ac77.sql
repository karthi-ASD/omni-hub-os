
-- Phase 1: Enhance seo_campaigns with full project fields
ALTER TABLE public.seo_campaigns
  ADD COLUMN IF NOT EXISTS business_name text,
  ADD COLUMN IF NOT EXISTS package_type text NOT NULL DEFAULT 'basic',
  ADD COLUMN IF NOT EXISTS monthly_fee numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS yearly_fee numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS contract_duration_months integer DEFAULT 12,
  ADD COLUMN IF NOT EXISTS billing_type text NOT NULL DEFAULT 'recurring',
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS assigned_seo_manager_user_id uuid,
  ADD COLUMN IF NOT EXISTS assigned_seo_executive_user_id uuid,
  ADD COLUMN IF NOT EXISTS assigned_content_writer_user_id uuid,
  ADD COLUMN IF NOT EXISTS renewal_date date,
  ADD COLUMN IF NOT EXISTS competitors_json jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS target_locations_json jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS target_radius_km integer,
  ADD COLUMN IF NOT EXISTS previous_seo_done boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_status text NOT NULL DEFAULT 'pending_access',
  ADD COLUMN IF NOT EXISTS onboarding_notes text;

-- Enhance seo_keywords with ranking fields
ALTER TABLE public.seo_keywords
  ADD COLUMN IF NOT EXISTS current_ranking integer,
  ADD COLUMN IF NOT EXISTS previous_ranking integer,
  ADD COLUMN IF NOT EXISTS location text;

-- Enhance seo_offpage_items with backlink details
ALTER TABLE public.seo_offpage_items
  ADD COLUMN IF NOT EXISTS website_name text,
  ADD COLUMN IF NOT EXISTS da_score integer,
  ADD COLUMN IF NOT EXISTS anchor_text text,
  ADD COLUMN IF NOT EXISTS follow_type text NOT NULL DEFAULT 'dofollow';

-- Enhance seo_content_items with content management fields
ALTER TABLE public.seo_content_items
  ADD COLUMN IF NOT EXISTS word_count integer,
  ADD COLUMN IF NOT EXISTS draft_link text,
  ADD COLUMN IF NOT EXISTS client_approval_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS publish_date date,
  ADD COLUMN IF NOT EXISTS live_url text,
  ADD COLUMN IF NOT EXISTS target_keyword text;

-- Create GBP Profiles table
CREATE TABLE IF NOT EXISTS public.seo_gbp_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id),
  campaign_id uuid NOT NULL REFERENCES public.seo_campaigns(id) ON DELETE CASCADE,
  existing_listing boolean DEFAULT false,
  listing_url text,
  verification_status text NOT NULL DEFAULT 'not_started',
  nap_consistency_check boolean DEFAULT false,
  reviews_count integer DEFAULT 0,
  rating_avg numeric DEFAULT 0,
  gmb_posts_count integer DEFAULT 0,
  last_optimisation_date date,
  last_post_date date,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_gbp_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business gbp"
  ON public.seo_gbp_profiles FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can insert own business gbp"
  ON public.seo_gbp_profiles FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can update own business gbp"
  ON public.seo_gbp_profiles FOR UPDATE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Create Technical SEO Audits table
CREATE TABLE IF NOT EXISTS public.seo_technical_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id),
  campaign_id uuid NOT NULL REFERENCES public.seo_campaigns(id) ON DELETE CASCADE,
  desktop_speed numeric,
  mobile_speed numeric,
  ssl_active boolean DEFAULT false,
  sitemap_submitted boolean DEFAULT false,
  robots_txt_checked boolean DEFAULT false,
  schema_added boolean DEFAULT false,
  broken_links_count integer DEFAULT 0,
  core_web_vitals_json jsonb DEFAULT '{}'::jsonb,
  last_audit_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_technical_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business technical audits"
  ON public.seo_technical_audits FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can insert own business technical audits"
  ON public.seo_technical_audits FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can update own business technical audits"
  ON public.seo_technical_audits FOR UPDATE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Create SEO Monthly Reports table
CREATE TABLE IF NOT EXISTS public.seo_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id),
  campaign_id uuid NOT NULL REFERENCES public.seo_campaigns(id) ON DELETE CASCADE,
  report_month text NOT NULL,
  traffic_current integer DEFAULT 0,
  traffic_previous integer DEFAULT 0,
  keywords_improved integer DEFAULT 0,
  keywords_dropped integer DEFAULT 0,
  backlinks_built integer DEFAULT 0,
  tasks_completed integer DEFAULT 0,
  conversions integer DEFAULT 0,
  report_pdf_url text,
  client_sent_date date,
  client_feedback text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business seo reports"
  ON public.seo_reports FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can insert own business seo reports"
  ON public.seo_reports FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can update own business seo reports"
  ON public.seo_reports FOR UPDATE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Create SEO Communication Logs table
CREATE TABLE IF NOT EXISTS public.seo_communication_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id),
  campaign_id uuid NOT NULL REFERENCES public.seo_campaigns(id) ON DELETE CASCADE,
  communication_type text NOT NULL DEFAULT 'email',
  summary text,
  follow_up_date date,
  assigned_to_user_id uuid,
  attachment_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_communication_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business seo comms"
  ON public.seo_communication_logs FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can insert own business seo comms"
  ON public.seo_communication_logs FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can update own business seo comms"
  ON public.seo_communication_logs FOR UPDATE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Trigger for technical audits updated_at
CREATE TRIGGER set_seo_technical_audits_updated_at
  BEFORE UPDATE ON public.seo_technical_audits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
