
-- Enable pg_cron and pg_net extensions for scheduled queue processing
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function to auto-queue voice agent session when a lead is created
CREATE OR REPLACE FUNCTION public.auto_queue_voice_session_on_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _policy record;
BEGIN
  -- Check if there's an active voice policy for this business
  SELECT * INTO _policy FROM public.voice_agent_policies
  WHERE business_id = NEW.business_id AND is_enabled = true
  LIMIT 1;

  IF _policy IS NULL THEN
    RETURN NEW;
  END IF;

  -- Only queue if lead has a phone number
  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
    INSERT INTO public.voice_agent_sessions (
      business_id,
      lead_id,
      status,
      scheduled_call_at,
      attempt_number
    ) VALUES (
      NEW.business_id,
      NEW.id,
      'QUEUED',
      now(),
      1
    );

    -- Log system event
    INSERT INTO public.system_events (business_id, event_type, payload_json)
    VALUES (
      NEW.business_id,
      'VOICE_SESSION_AUTO_QUEUED',
      jsonb_build_object('lead_id', NEW.id, 'lead_name', NEW.name, 'phone', NEW.phone)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Function to auto-queue voice agent session when an inquiry is created
CREATE OR REPLACE FUNCTION public.auto_queue_voice_session_on_inquiry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _policy record;
BEGIN
  -- Check if there's an active voice policy for this business
  SELECT * INTO _policy FROM public.voice_agent_policies
  WHERE business_id = NEW.business_id AND is_enabled = true
  LIMIT 1;

  IF _policy IS NULL THEN
    RETURN NEW;
  END IF;

  -- Only queue if inquiry has a phone number
  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
    INSERT INTO public.voice_agent_sessions (
      business_id,
      inquiry_id,
      status,
      scheduled_call_at,
      attempt_number
    ) VALUES (
      NEW.business_id,
      NEW.id,
      'QUEUED',
      now(),
      1
    );

    -- Log system event
    INSERT INTO public.system_events (business_id, event_type, payload_json)
    VALUES (
      NEW.business_id,
      'VOICE_SESSION_AUTO_QUEUED',
      jsonb_build_object('inquiry_id', NEW.id, 'name', NEW.name, 'phone', NEW.phone)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create triggers on leads and inquiries tables
CREATE TRIGGER trg_auto_queue_voice_on_lead
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_queue_voice_session_on_lead();

CREATE TRIGGER trg_auto_queue_voice_on_inquiry
  AFTER INSERT ON public.inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_queue_voice_session_on_inquiry();
