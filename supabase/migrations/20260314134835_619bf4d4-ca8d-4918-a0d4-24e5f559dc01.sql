
-- Add visibility and reward config to advocacy_campaigns
ALTER TABLE public.advocacy_campaigns
  ADD COLUMN IF NOT EXISTS visibility_type text NOT NULL DEFAULT 'all_employees',
  ADD COLUMN IF NOT EXISTS visibility_targets text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS reward_type text NOT NULL DEFAULT 'points',
  ADD COLUMN IF NOT EXISTS reward_trigger text NOT NULL DEFAULT 'share',
  ADD COLUMN IF NOT EXISTS points_per_share integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS points_per_click integer NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS points_per_lead integer NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS points_per_sale integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS caption_template text;

-- Add tracking fields to referral_tracking
ALTER TABLE public.referral_tracking
  ADD COLUMN IF NOT EXISTS device text,
  ADD COLUMN IF NOT EXISTS browser text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS channel text;

-- Add gamification badges table
CREATE TABLE IF NOT EXISTS public.advocacy_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  badge_type text NOT NULL,
  badge_label text NOT NULL,
  earned_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.advocacy_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view badges in their business"
  ON public.advocacy_badges FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "System can insert badges"
  ON public.advocacy_badges FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

-- Global settings table for advocacy module
CREATE TABLE IF NOT EXISTS public.advocacy_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL UNIQUE,
  default_points_per_share integer NOT NULL DEFAULT 5,
  default_points_per_click integer NOT NULL DEFAULT 2,
  default_points_per_lead integer NOT NULL DEFAULT 20,
  default_points_per_sale integer NOT NULL DEFAULT 100,
  anti_fraud_cooldown_seconds integer NOT NULL DEFAULT 60,
  default_network_size integer NOT NULL DEFAULT 500,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.advocacy_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business users can view settings"
  ON public.advocacy_settings FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Admins can manage settings"
  ON public.advocacy_settings FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));
