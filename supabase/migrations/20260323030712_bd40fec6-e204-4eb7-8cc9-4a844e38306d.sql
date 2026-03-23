ALTER TABLE public.crm_call_communications
  ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ DEFAULT NULL;