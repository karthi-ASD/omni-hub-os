
-- Trigger: Auto-notify when keyword ranking drops more than 10 positions
CREATE OR REPLACE FUNCTION public.notify_seo_ranking_drop()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _campaign record;
  _drop integer;
BEGIN
  -- Only fire when current_ranking is updated and previous exists
  IF NEW.current_ranking IS NOT NULL AND OLD.current_ranking IS NOT NULL THEN
    _drop := NEW.current_ranking - OLD.current_ranking;
    IF _drop > 10 THEN
      -- Save old ranking as previous
      NEW.previous_ranking := OLD.current_ranking;
      
      -- Get campaign info
      SELECT * INTO _campaign FROM public.seo_campaigns WHERE id = NEW.campaign_id;
      
      -- Create notification for SEO manager
      IF _campaign.assigned_seo_manager_user_id IS NOT NULL THEN
        INSERT INTO public.notifications (business_id, user_id, type, title, message)
        VALUES (
          _campaign.business_id,
          _campaign.assigned_seo_manager_user_id,
          'warning',
          'Ranking Drop Alert',
          'Keyword "' || NEW.keyword || '" dropped ' || _drop || ' positions (now #' || NEW.current_ranking || ')'
        );
      END IF;
      
      -- Log system event
      INSERT INTO public.system_events (business_id, event_type, payload_json)
      VALUES (
        _campaign.business_id,
        'SEO_RANKING_DROP',
        jsonb_build_object(
          'keyword', NEW.keyword,
          'old_ranking', OLD.current_ranking,
          'new_ranking', NEW.current_ranking,
          'drop', _drop,
          'campaign_id', NEW.campaign_id
        )
      );
    ELSE
      -- Always save previous ranking on update
      NEW.previous_ranking := OLD.current_ranking;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_seo_ranking_drop
  BEFORE UPDATE ON public.seo_keywords
  FOR EACH ROW EXECUTE FUNCTION public.notify_seo_ranking_drop();
