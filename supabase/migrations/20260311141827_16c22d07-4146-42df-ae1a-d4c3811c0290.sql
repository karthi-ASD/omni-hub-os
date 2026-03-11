
ALTER TABLE public.gateway_transactions
  ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'card',
  ADD COLUMN IF NOT EXISTS receipt_number TEXT,
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_email TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS collected_by_user_id UUID;

CREATE INDEX IF NOT EXISTS idx_gateway_txn_job ON public.gateway_transactions(job_id);
