
-- Advocacy Campaigns
CREATE TABLE public.advocacy_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  media_url TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  campaign_type TEXT NOT NULL DEFAULT 'employee_advocacy',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  rewards_enabled BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active',
  share_message_template TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.advocacy_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for advocacy_campaigns" ON public.advocacy_campaigns
  FOR ALL TO authenticated
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- Referral Tracking
CREATE TABLE public.referral_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.advocacy_campaigns(id) ON DELETE CASCADE,
  referrer_type TEXT NOT NULL DEFAULT 'employee',
  referrer_id TEXT NOT NULL,
  referrer_user_id UUID,
  visitor_ip TEXT,
  click_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  lead_generated BOOLEAN NOT NULL DEFAULT false,
  sale_generated BOOLEAN NOT NULL DEFAULT false,
  lead_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for referral_tracking" ON public.referral_tracking
  FOR ALL TO authenticated
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- Employee Points
CREATE TABLE public.employee_advocacy_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  points_total INTEGER NOT NULL DEFAULT 0,
  shares_count INTEGER NOT NULL DEFAULT 0,
  clicks_count INTEGER NOT NULL DEFAULT 0,
  leads_generated INTEGER NOT NULL DEFAULT 0,
  sales_generated INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, user_id)
);

ALTER TABLE public.employee_advocacy_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for employee_advocacy_points" ON public.employee_advocacy_points
  FOR ALL TO authenticated
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- Campaign Shares log
CREATE TABLE public.advocacy_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.advocacy_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  referral_code TEXT NOT NULL,
  shared_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.advocacy_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for advocacy_shares" ON public.advocacy_shares
  FOR ALL TO authenticated
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));
