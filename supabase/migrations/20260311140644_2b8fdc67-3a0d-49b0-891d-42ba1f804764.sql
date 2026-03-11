
-- AI Chat Logs table for storing chatbot conversations
CREATE TABLE public.ai_chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  sender_email TEXT,
  sender_name TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  message TEXT NOT NULL,
  metadata_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_chat_logs_session ON public.ai_chat_logs(session_id);
CREATE INDEX idx_ai_chat_logs_business ON public.ai_chat_logs(business_id);

ALTER TABLE public.ai_chat_logs ENABLE ROW LEVEL SECURITY;

-- Public insert for chatbot (no auth required for customer-facing widget)
CREATE POLICY "Anyone can insert chat logs" ON public.ai_chat_logs
  FOR INSERT WITH CHECK (true);

-- Business admins can read their own business chat logs
CREATE POLICY "Business users can read own chat logs" ON public.ai_chat_logs
  FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));
