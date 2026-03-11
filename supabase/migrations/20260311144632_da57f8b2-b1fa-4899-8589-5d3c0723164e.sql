
-- 1. Ads campaign tracking table
CREATE TABLE IF NOT EXISTS public.ads_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  client_id UUID REFERENCES public.clients(id),
  connection_id UUID REFERENCES public.analytics_connections(id),
  platform TEXT NOT NULL DEFAULT 'google_ads', -- google_ads | meta_ads
  campaign_name TEXT NOT NULL,
  campaign_external_id TEXT,
  status TEXT DEFAULT 'active',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  spend NUMERIC(12,2) DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  leads INTEGER DEFAULT 0,
  cpc NUMERIC(8,4) DEFAULT 0,
  ctr NUMERIC(6,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ads_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ads_campaigns_business_isolation" ON public.ads_campaigns
  FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

-- 2. Email campaign analytics table  
CREATE TABLE IF NOT EXISTS public.email_campaign_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  send_id UUID REFERENCES public.communications_sends(id),
  campaign_name TEXT,
  recipient_email TEXT,
  sent_at TIMESTAMPTZ DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  delivery_status TEXT DEFAULT 'queued', -- queued | sent | delivered | opened | clicked | bounced | unsubscribed
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.email_campaign_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_analytics_business_isolation" ON public.email_campaign_analytics
  FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

-- 3. Add duration fields to jobs
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS estimated_duration_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS actual_duration_minutes INTEGER;

-- 4. Add download_count to client_mobile_apps
ALTER TABLE public.client_mobile_apps
  ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;
