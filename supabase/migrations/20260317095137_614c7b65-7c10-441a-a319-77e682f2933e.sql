
ALTER TABLE public.seo_projects ADD COLUMN IF NOT EXISTS default_country_code text DEFAULT '+61';

CREATE TABLE IF NOT EXISTS public.seo_automation_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  seo_project_id uuid NOT NULL,
  business_id uuid NOT NULL,
  automation_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  next_retry_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending',
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.seo_automation_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view automation queue" ON public.seo_automation_queue
  FOR SELECT TO authenticated
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.seo_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  seo_project_id uuid,
  user_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view seo audit logs" ON public.seo_audit_log
  FOR SELECT TO authenticated
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Staff can insert seo audit logs" ON public.seo_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));
