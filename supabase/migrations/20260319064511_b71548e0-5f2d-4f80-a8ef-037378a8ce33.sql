ALTER TABLE public.seo_lead_forms ADD COLUMN IF NOT EXISTS to_emails JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.seo_lead_forms ADD COLUMN IF NOT EXISTS cc_emails JSONB DEFAULT '[]'::jsonb;