
-- ============================================================
-- WhatsApp Support Module - Database Schema
-- ============================================================

-- 1) global_integrations - platform-level integration configs
CREATE TABLE IF NOT EXISTS public.global_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_key text UNIQUE NOT NULL,
  integration_name text NOT NULL,
  provider text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

ALTER TABLE public.global_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage global integrations" ON public.global_integrations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Staff can view active global integrations" ON public.global_integrations
  FOR SELECT TO authenticated
  USING (is_active = true);

-- 2) client_whatsapp_identity - map client phone numbers
CREATE TABLE IF NOT EXISTS public.client_whatsapp_identity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  whatsapp_phone_e164 text NOT NULL,
  whatsapp_phone_normalized text NOT NULL,
  contact_name text,
  is_primary boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, whatsapp_phone_normalized)
);

CREATE INDEX idx_cwi_phone ON public.client_whatsapp_identity(whatsapp_phone_normalized);
CREATE INDEX idx_cwi_client ON public.client_whatsapp_identity(client_id);

ALTER TABLE public.client_whatsapp_identity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage client whatsapp identity" ON public.client_whatsapp_identity
  FOR ALL TO authenticated
  USING (client_id IN (SELECT id FROM public.clients WHERE business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid())))
  WITH CHECK (client_id IN (SELECT id FROM public.clients WHERE business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid())));

-- 3) whatsapp_conversations - conversation threads
CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  ticket_id uuid REFERENCES public.support_tickets(id) ON DELETE SET NULL,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  channel_type text NOT NULL DEFAULT 'nextweb_support',
  direction_last text,
  client_whatsapp_phone text NOT NULL,
  phone_number_id text NOT NULL,
  business_account_id text,
  last_message_at timestamptz,
  last_message_preview text,
  status text NOT NULL DEFAULT 'open',
  unread_for_support_count integer NOT NULL DEFAULT 0,
  unread_for_client_count integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_wc_client ON public.whatsapp_conversations(client_id);
CREATE INDEX idx_wc_ticket ON public.whatsapp_conversations(ticket_id);
CREATE INDEX idx_wc_last_msg ON public.whatsapp_conversations(last_message_at DESC);
CREATE INDEX idx_wc_phone ON public.whatsapp_conversations(client_whatsapp_phone);
CREATE INDEX idx_wc_channel ON public.whatsapp_conversations(channel_type);
CREATE INDEX idx_wc_business ON public.whatsapp_conversations(business_id);

ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view whatsapp conversations" ON public.whatsapp_conversations
  FOR SELECT TO authenticated
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Staff can insert whatsapp conversations" ON public.whatsapp_conversations
  FOR INSERT TO authenticated
  WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Staff can update whatsapp conversations" ON public.whatsapp_conversations
  FOR UPDATE TO authenticated
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- 4) whatsapp_messages - all messages
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  ticket_id uuid REFERENCES public.support_tickets(id) ON DELETE SET NULL,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  whatsapp_message_id text UNIQUE,
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  sender_type text NOT NULL CHECK (sender_type IN ('client', 'support', 'system')),
  sender_user_id uuid,
  sender_display_name text,
  recipient_phone text,
  from_phone text,
  to_phone text,
  message_type text NOT NULL DEFAULT 'text',
  message_text text,
  media_url text,
  media_mime_type text,
  media_file_name text,
  media_meta jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'received',
  status_updated_at timestamptz,
  raw_payload jsonb NOT NULL DEFAULT '{}',
  sent_at timestamptz,
  received_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  failed_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_wm_conv_created ON public.whatsapp_messages(conversation_id, created_at);
CREATE INDEX idx_wm_client_created ON public.whatsapp_messages(client_id, created_at);
CREATE INDEX idx_wm_ticket_created ON public.whatsapp_messages(ticket_id, created_at);
CREATE INDEX idx_wm_status ON public.whatsapp_messages(status);
CREATE INDEX idx_wm_direction ON public.whatsapp_messages(direction);
CREATE INDEX idx_wm_wa_id ON public.whatsapp_messages(whatsapp_message_id);

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view whatsapp messages" ON public.whatsapp_messages
  FOR SELECT TO authenticated
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Staff can insert whatsapp messages" ON public.whatsapp_messages
  FOR INSERT TO authenticated
  WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Staff can update whatsapp messages" ON public.whatsapp_messages
  FOR UPDATE TO authenticated
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- 5) whatsapp_message_status_events - delivery/read tracking
CREATE TABLE IF NOT EXISTS public.whatsapp_message_status_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  whatsapp_message_id text NOT NULL,
  conversation_id uuid REFERENCES public.whatsapp_conversations(id) ON DELETE SET NULL,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  status text NOT NULL,
  event_payload jsonb NOT NULL DEFAULT '{}',
  event_time timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_wmse_wa_id ON public.whatsapp_message_status_events(whatsapp_message_id);

ALTER TABLE public.whatsapp_message_status_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view status events" ON public.whatsapp_message_status_events
  FOR SELECT TO authenticated
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- 6) Extend support_tickets - add WhatsApp-specific columns
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual';
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS source_channel text;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS whatsapp_conversation_id uuid REFERENCES public.whatsapp_conversations(id) ON DELETE SET NULL;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS client_last_message_at timestamptz;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS support_last_reply_at timestamptz;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS assigned_team text DEFAULT 'support';

-- Enable realtime for conversations and messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;
