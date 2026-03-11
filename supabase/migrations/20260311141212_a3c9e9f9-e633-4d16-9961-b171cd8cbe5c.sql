
ALTER TABLE public.jobs
  ADD COLUMN customer_confirmation_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN customer_reschedule_request TEXT,
  ADD COLUMN rescheduled_time TIMESTAMPTZ;
