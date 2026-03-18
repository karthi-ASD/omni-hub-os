
-- Add missing columns to seo_captured_leads
ALTER TABLE public.seo_captured_leads
  ADD COLUMN IF NOT EXISTS ip_address text,
  ADD COLUMN IF NOT EXISTS user_agent text,
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text;

-- Add index on client_id for seo_captured_leads
CREATE INDEX IF NOT EXISTS idx_seo_captured_leads_client_id ON public.seo_captured_leads(client_id);

-- Add missing columns to seo_lead_forms for form builder
ALTER TABLE public.seo_lead_forms
  ADD COLUMN IF NOT EXISTS fields_json jsonb DEFAULT '[{"name":"name","label":"Name","type":"text","required":true},{"name":"phone","label":"Phone","type":"tel","required":true},{"name":"email","label":"Email","type":"email","required":false},{"name":"message","label":"Message","type":"textarea","required":false}]'::jsonb,
  ADD COLUMN IF NOT EXISTS success_message text DEFAULT 'Thank you! We will get back to you shortly.',
  ADD COLUMN IF NOT EXISTS redirect_url text,
  ADD COLUMN IF NOT EXISTS created_by uuid;

-- RLS policies for seo_lead_forms (if not already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'seo_lead_forms' AND policyname = 'Staff can manage lead forms'
  ) THEN
    CREATE POLICY "Staff can manage lead forms"
    ON public.seo_lead_forms FOR ALL
    USING (
      business_id IN (
        SELECT business_id FROM public.profiles WHERE user_id = auth.uid()
      )
    );
  END IF;
END $$;
