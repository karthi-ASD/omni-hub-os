-- Enable realtime for daily_insights so the popup can listen
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_insights;

-- Trigger: when a broadcast is published, create notifications for all users in that business
CREATE OR REPLACE FUNCTION public.notify_broadcast_published()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'published' THEN
    INSERT INTO public.notifications (business_id, user_id, type, title, message)
    SELECT
      NEW.business_id,
      p.user_id,
      'info'::notification_type,
      '🔔 ' || NEW.title,
      LEFT(COALESCE(NEW.message, ''), 200)
    FROM public.profiles p
    WHERE p.business_id = NEW.business_id
      AND p.user_id != COALESCE(NEW.created_by, '00000000-0000-0000-0000-000000000000'::uuid);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_broadcast_notify
AFTER INSERT ON public.daily_insights
FOR EACH ROW
EXECUTE FUNCTION public.notify_broadcast_published();