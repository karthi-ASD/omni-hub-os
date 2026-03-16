
-- Add lead intelligence columns to leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lead_score INT DEFAULT 0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lead_temperature TEXT DEFAULT 'cold' CHECK (lead_temperature IN ('cold', 'warm', 'hot'));
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS total_calls INT DEFAULT 0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS total_emails INT DEFAULT 0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS total_whatsapp INT DEFAULT 0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS website_visits INT DEFAULT 0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS proposal_sent BOOLEAN DEFAULT false;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_contact_method TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS engagement_score INT DEFAULT 0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS response_speed_hours INT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ai_prediction TEXT DEFAULT 'needs_follow_up' CHECK (ai_prediction IN ('likely_to_convert', 'needs_follow_up', 'low_probability'));

-- Index for scoring queries
CREATE INDEX IF NOT EXISTS idx_leads_lead_score ON public.leads(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_lead_temperature ON public.leads(lead_temperature);
CREATE INDEX IF NOT EXISTS idx_leads_last_activity ON public.leads(last_activity_at);
