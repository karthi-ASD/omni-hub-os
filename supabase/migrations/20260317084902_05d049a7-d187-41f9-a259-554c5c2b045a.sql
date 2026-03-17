-- SLA breach auto-escalation trigger
CREATE OR REPLACE FUNCTION public.auto_escalate_sla_breach()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.sla_due_at IS NOT NULL
    AND NEW.sla_due_at < NOW()
    AND NEW.status NOT IN ('resolved', 'closed', 'escalated')
  THEN
    NEW.status := 'escalated';
    NEW.escalated_at := COALESCE(NEW.escalated_at, NOW());
    IF NEW.priority IN ('low', 'medium') THEN
      NEW.priority := 'high';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_auto_escalate_sla'
  ) THEN
    CREATE TRIGGER trg_auto_escalate_sla
      BEFORE UPDATE ON public.support_tickets
      FOR EACH ROW
      EXECUTE FUNCTION public.auto_escalate_sla_breach();
  END IF;
END;
$$;