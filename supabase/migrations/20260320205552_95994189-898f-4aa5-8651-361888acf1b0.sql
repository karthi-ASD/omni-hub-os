
ALTER TABLE public.dialer_sessions
ADD COLUMN IF NOT EXISTS customer_call_id text,
ADD COLUMN IF NOT EXISTS conference_id text;
