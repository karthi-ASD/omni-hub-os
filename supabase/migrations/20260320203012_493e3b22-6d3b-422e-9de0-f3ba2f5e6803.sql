ALTER TABLE public.dialer_sessions
ADD COLUMN IF NOT EXISTS agent_connected boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS customer_connected boolean DEFAULT false;