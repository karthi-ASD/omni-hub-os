
-- 1. Extend support_tickets with new columns for email ticketing
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS sender_name TEXT,
  ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS client_match_status TEXT NOT NULL DEFAULT 'matched',
  ADD COLUMN IF NOT EXISTS message_id TEXT,
  ADD COLUMN IF NOT EXISTS in_reply_to TEXT,
  ADD COLUMN IF NOT EXISTS original_html TEXT,
  ADD COLUMN IF NOT EXISTS email_from TEXT,
  ADD COLUMN IF NOT EXISTS email_to TEXT,
  ADD COLUMN IF NOT EXISTS auto_reply_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS linked_by_user_id UUID,
  ADD COLUMN IF NOT EXISTS linked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suggested_client_ids UUID[] DEFAULT '{}';

-- 2. Client alternate emails for improved matching
CREATE TABLE IF NOT EXISTS public.client_alternate_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  label TEXT DEFAULT 'alternate',
  added_by_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, email)
);
ALTER TABLE public.client_alternate_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view alternate emails for their business"
  ON public.client_alternate_emails FOR SELECT TO authenticated
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert alternate emails for their business"
  ON public.client_alternate_emails FOR INSERT TO authenticated
  WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete alternate emails for their business"
  ON public.client_alternate_emails FOR DELETE TO authenticated
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- 3. Ticket messages (conversation thread)
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL DEFAULT 'agent',
  sender_user_id UUID,
  sender_name TEXT,
  sender_email TEXT,
  content TEXT NOT NULL,
  content_html TEXT,
  is_internal BOOLEAN DEFAULT false,
  message_id TEXT,
  in_reply_to TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ticket messages for their business"
  ON public.ticket_messages FOR SELECT TO authenticated
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert ticket messages for their business"
  ON public.ticket_messages FOR INSERT TO authenticated
  WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- 4. Ticket attachments
CREATE TABLE IF NOT EXISTS public.ticket_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.ticket_messages(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  storage_path TEXT NOT NULL,
  uploaded_by_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ticket attachments for their business"
  ON public.ticket_attachments FOR SELECT TO authenticated
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert ticket attachments for their business"
  ON public.ticket_attachments FOR INSERT TO authenticated
  WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- 5. Email configurations (IMAP + Gmail)
CREATE TABLE IF NOT EXISTS public.email_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  config_name TEXT NOT NULL,
  provider_type TEXT NOT NULL DEFAULT 'imap',
  email_address TEXT NOT NULL,
  imap_host TEXT,
  imap_port INTEGER DEFAULT 993,
  smtp_host TEXT,
  smtp_port INTEGER DEFAULT 587,
  encryption_type TEXT DEFAULT 'ssl',
  username TEXT,
  password_secret_key TEXT,
  google_oauth_client_id TEXT,
  google_oauth_client_secret_key TEXT,
  google_refresh_token_key TEXT,
  monitored BOOLEAN DEFAULT true,
  polling_interval_seconds INTEGER DEFAULT 300,
  default_department TEXT,
  last_polled_at TIMESTAMPTZ,
  last_message_uid TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.email_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage email configs for their business"
  ON public.email_configurations FOR ALL TO authenticated
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- 6. Ticket SLA policies
CREATE TABLE IF NOT EXISTS public.ticket_sla_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  priority TEXT NOT NULL,
  first_response_minutes INTEGER NOT NULL DEFAULT 120,
  resolution_minutes INTEGER NOT NULL DEFAULT 480,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, priority)
);
ALTER TABLE public.ticket_sla_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage SLA policies for their business"
  ON public.ticket_sla_policies FOR ALL TO authenticated
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- 7. Ticket audit log
CREATE TABLE IF NOT EXISTS public.ticket_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id UUID,
  user_name TEXT,
  action_type TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ticket_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ticket audit logs for their business"
  ON public.ticket_audit_log FOR SELECT TO authenticated
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert ticket audit logs for their business"
  ON public.ticket_audit_log FOR INSERT TO authenticated
  WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- 8. Enable realtime for ticket messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_messages;

-- 9. Storage bucket for ticket attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('ticket-attachments', 'ticket-attachments', false) ON CONFLICT DO NOTHING;

CREATE POLICY "Authenticated users can upload ticket attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ticket-attachments');

CREATE POLICY "Authenticated users can view ticket attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'ticket-attachments');

-- 10. Insert default SLA policies for existing businesses
INSERT INTO public.ticket_sla_policies (business_id, priority, first_response_minutes, resolution_minutes)
SELECT b.id, p.priority, p.first_response, p.resolution
FROM public.businesses b
CROSS JOIN (VALUES 
  ('critical', 30, 120),
  ('high', 120, 360),
  ('medium', 480, 1440),
  ('low', 1440, 2880)
) AS p(priority, first_response, resolution)
ON CONFLICT DO NOTHING;
