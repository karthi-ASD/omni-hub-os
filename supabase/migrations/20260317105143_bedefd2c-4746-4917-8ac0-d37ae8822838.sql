
-- =====================================================
-- CLIENT IDENTITY RESOLUTION INFRASTRUCTURE
-- =====================================================

-- 1. Unmatched records table for admin review
CREATE TABLE IF NOT EXISTS public.unmatched_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  source_table text NOT NULL,
  source_record_id uuid NOT NULL,
  match_attempted_at timestamptz NOT NULL DEFAULT now(),
  match_email text,
  match_phone text,
  match_name text,
  match_external_id text,
  suggested_client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  resolution_status text NOT NULL DEFAULT 'unmatched' CHECK (resolution_status IN ('unmatched','matched','ignored','merged')),
  resolved_client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  resolved_by uuid,
  resolved_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_unmatched_records_business ON public.unmatched_records(business_id);
CREATE INDEX IF NOT EXISTS idx_unmatched_records_status ON public.unmatched_records(resolution_status);
CREATE INDEX IF NOT EXISTS idx_unmatched_records_source ON public.unmatched_records(source_table, source_record_id);

ALTER TABLE public.unmatched_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view unmatched records"
  ON public.unmatched_records FOR SELECT TO authenticated
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Staff can update unmatched records"
  ON public.unmatched_records FOR UPDATE TO authenticated
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Staff can insert unmatched records"
  ON public.unmatched_records FOR INSERT TO authenticated
  WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- 2. Client identity resolution function (SECURITY DEFINER for cross-table lookups)
CREATE OR REPLACE FUNCTION public.resolve_client_id(
  _business_id uuid,
  _email text DEFAULT NULL,
  _phone text DEFAULT NULL,
  _external_id text DEFAULT NULL,
  _name text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _client_id uuid;
  _norm_email text;
  _norm_phone text;
BEGIN
  -- Normalize inputs
  _norm_email := lower(trim(COALESCE(_email, '')));
  _norm_phone := regexp_replace(COALESCE(_phone, ''), '[^0-9+]', '', 'g');

  -- Priority 1: External ID (Xero)
  IF _external_id IS NOT NULL AND _external_id != '' THEN
    SELECT id INTO _client_id
    FROM public.clients
    WHERE business_id = _business_id
      AND xero_contact_id = _external_id
      AND deleted_at IS NULL AND merged_into IS NULL
    LIMIT 1;
    IF _client_id IS NOT NULL THEN RETURN _client_id; END IF;
  END IF;

  -- Priority 2: Exact email match
  IF _norm_email != '' THEN
    SELECT id INTO _client_id
    FROM public.clients
    WHERE business_id = _business_id
      AND lower(trim(email)) = _norm_email
      AND deleted_at IS NULL AND merged_into IS NULL
    LIMIT 1;
    IF _client_id IS NOT NULL THEN RETURN _client_id; END IF;
  END IF;

  -- Priority 3: Phone match (strip non-digits, suffix match for country code variations)
  IF _norm_phone != '' AND length(_norm_phone) >= 8 THEN
    SELECT id INTO _client_id
    FROM public.clients
    WHERE business_id = _business_id
      AND deleted_at IS NULL AND merged_into IS NULL
      AND (
        regexp_replace(COALESCE(phone,''), '[^0-9]', '', 'g') LIKE '%' || right(_norm_phone, 9)
        OR regexp_replace(COALESCE(mobile,''), '[^0-9]', '', 'g') LIKE '%' || right(_norm_phone, 9)
      )
    LIMIT 1;
    IF _client_id IS NOT NULL THEN RETURN _client_id; END IF;
  END IF;

  RETURN NULL;
END;
$$;

-- 3. Client data integrity view for admin dashboard
CREATE OR REPLACE VIEW public.client_integrity_report AS
SELECT
  c.id,
  c.business_id,
  c.contact_name,
  c.email,
  c.phone,
  c.xero_contact_id,
  c.client_status,
  -- Duplicate email detection
  (SELECT count(*) FROM public.clients c2
   WHERE lower(c2.email) = lower(c.email)
     AND c2.business_id = c.business_id
     AND c2.id != c.id
     AND c2.deleted_at IS NULL AND c2.merged_into IS NULL) AS duplicate_email_count,
  -- Duplicate phone detection
  (SELECT count(*) FROM public.clients c2
   WHERE c2.phone IS NOT NULL AND c.phone IS NOT NULL
     AND regexp_replace(c2.phone, '[^0-9]', '', 'g') = regexp_replace(c.phone, '[^0-9]', '', 'g')
     AND c2.business_id = c.business_id
     AND c2.id != c.id
     AND c2.deleted_at IS NULL AND c2.merged_into IS NULL) AS duplicate_phone_count,
  -- Linked entity counts
  (SELECT count(*) FROM public.support_tickets t WHERE t.client_id = c.id) AS ticket_count,
  (SELECT count(*) FROM public.seo_projects s WHERE s.client_id = c.id) AS seo_project_count,
  (SELECT count(*) FROM public.xero_invoices x WHERE x.client_id = c.id) AS invoice_count,
  (SELECT count(*) FROM public.projects p WHERE p.client_id = c.id) AS project_count
FROM public.clients c
WHERE c.deleted_at IS NULL AND c.merged_into IS NULL;

-- 4. Add indexes on clients table for identity resolution performance
CREATE INDEX IF NOT EXISTS idx_clients_email_lower ON public.clients (lower(email)) WHERE deleted_at IS NULL AND merged_into IS NULL;
CREATE INDEX IF NOT EXISTS idx_clients_xero_contact ON public.clients (xero_contact_id) WHERE xero_contact_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clients_business_status ON public.clients (business_id, client_status) WHERE deleted_at IS NULL AND merged_into IS NULL;
