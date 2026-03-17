-- Audit log for backfill operations
CREATE TABLE IF NOT EXISTS public.client_backfill_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id),
  source_table text NOT NULL,
  source_record_id text NOT NULL,
  old_client_id uuid,
  new_client_id uuid,
  match_method text NOT NULL,
  confidence text NOT NULL DEFAULT 'medium',
  is_dry_run boolean NOT NULL DEFAULT true,
  applied_at timestamptz,
  applied_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_backfill_audit_business ON public.client_backfill_audit_log(business_id);
CREATE INDEX idx_backfill_audit_table ON public.client_backfill_audit_log(source_table);
CREATE INDEX idx_backfill_audit_dry_run ON public.client_backfill_audit_log(is_dry_run);

ALTER TABLE public.client_backfill_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view audit logs for their business"
  ON public.client_backfill_audit_log FOR SELECT TO authenticated
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- Add client_health_status to clients table
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS client_health_status text NOT NULL DEFAULT 'healthy';

-- Add confidence and match method columns to unmatched_records
ALTER TABLE public.unmatched_records ADD COLUMN IF NOT EXISTS match_confidence text;
ALTER TABLE public.unmatched_records ADD COLUMN IF NOT EXISTS suggested_match_method text;