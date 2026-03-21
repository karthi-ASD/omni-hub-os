
-- Browser dialer endpoints table for Plivo WebRTC
CREATE TABLE IF NOT EXISTS public.dialer_browser_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  plivo_endpoint_id text,
  plivo_username text NOT NULL,
  plivo_password text NOT NULL,
  plivo_app_id text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(business_id, user_id)
);

ALTER TABLE public.dialer_browser_endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own browser endpoint"
  ON public.dialer_browser_endpoints
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Add call_mode column to dialer_sessions
ALTER TABLE public.dialer_sessions 
  ADD COLUMN IF NOT EXISTS call_mode text DEFAULT 'browser';
