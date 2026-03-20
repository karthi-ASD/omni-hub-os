
-- Add missing fields for Lead Engine qualification & automation
ALTER TABLE public.crm_leads
  ADD COLUMN IF NOT EXISTS investment_timeline text,
  ADD COLUMN IF NOT EXISTS location_preference text,
  ADD COLUMN IF NOT EXISTS lead_temperature text DEFAULT 'cold',
  ADD COLUMN IF NOT EXISTS assigned_employee_id uuid,
  ADD COLUMN IF NOT EXISTS assigned_at timestamptz,
  ADD COLUMN IF NOT EXISTS first_contact_at timestamptz,
  ADD COLUMN IF NOT EXISTS sla_breached boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_scored boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS referral_source_name text,
  ADD COLUMN IF NOT EXISTS meta_lead_id text,
  ADD COLUMN IF NOT EXISTS whatsapp_sent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_sent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS qualification_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS contact_attempts integer DEFAULT 0;

-- Create lead automation rules table
CREATE TABLE IF NOT EXISTS public.crm_lead_automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id),
  rule_name text NOT NULL,
  trigger_event text NOT NULL DEFAULT 'lead_created',
  action_type text NOT NULL,
  action_config_json jsonb,
  is_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.crm_lead_automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their business automation rules"
  ON public.crm_lead_automation_rules
  FOR ALL
  TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- Create lead activity log table
CREATE TABLE IF NOT EXISTS public.crm_lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id),
  lead_id uuid NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  description text,
  performed_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.crm_lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their business lead activities"
  ON public.crm_lead_activities
  FOR ALL
  TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));
