ALTER TABLE public.crm_call_communications
  ADD COLUMN IF NOT EXISTS processing_status TEXT NOT NULL DEFAULT 'idle',
  ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0;