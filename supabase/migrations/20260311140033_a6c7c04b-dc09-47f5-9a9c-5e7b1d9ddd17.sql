
-- Add email threading fields to support_tickets
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS sender_email text,
  ADD COLUMN IF NOT EXISTS email_thread_id text;

CREATE INDEX IF NOT EXISTS idx_support_tickets_email_thread_id
  ON public.support_tickets(email_thread_id) WHERE email_thread_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_support_tickets_sender_email
  ON public.support_tickets(sender_email) WHERE sender_email IS NOT NULL;

-- Add sender_email, message_id, direction to ticket_email_logs
ALTER TABLE public.ticket_email_logs
  ADD COLUMN IF NOT EXISTS sender_email text,
  ADD COLUMN IF NOT EXISTS message_id text,
  ADD COLUMN IF NOT EXISTS direction text DEFAULT 'inbound';

-- Make ticket_comments.user_id nullable for system/email-originated comments
ALTER TABLE public.ticket_comments ALTER COLUMN user_id DROP NOT NULL;

-- Add sender_name to ticket_comments for email authors
ALTER TABLE public.ticket_comments
  ADD COLUMN IF NOT EXISTS sender_name text,
  ADD COLUMN IF NOT EXISTS sender_email text,
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'portal';

-- RLS: allow the inbound-email edge function (service role) to insert
-- The edge function uses service_role key so RLS is bypassed automatically
