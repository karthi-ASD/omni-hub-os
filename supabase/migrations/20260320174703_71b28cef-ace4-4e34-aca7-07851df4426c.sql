
-- 1. Add call_cost and bill_duration to dialer_sessions
ALTER TABLE public.dialer_sessions ADD COLUMN IF NOT EXISTS call_cost NUMERIC DEFAULT 0;
ALTER TABLE public.dialer_sessions ADD COLUMN IF NOT EXISTS bill_duration INTEGER DEFAULT 0;

-- 2. Add priority_score to leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS priority_score INTEGER DEFAULT 0;

-- 3. Unique constraint on dialer_call_tags(session_id, tag)
ALTER TABLE public.dialer_call_tags ADD CONSTRAINT dialer_call_tags_session_tag_unique UNIQUE (session_id, tag);

-- 4. Create dialer_ai_logs table
CREATE TABLE IF NOT EXISTS public.dialer_ai_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.dialer_sessions(id) ON DELETE CASCADE NOT NULL,
  transcript TEXT,
  summary TEXT,
  sentiment TEXT,
  score NUMERIC,
  next_action TEXT,
  priority TEXT,
  key_points TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.dialer_ai_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own business AI logs"
  ON public.dialer_ai_logs FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.dialer_sessions ds
    WHERE ds.id = dialer_ai_logs.session_id
    AND (ds.business_id = get_user_business_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role))
  ));

CREATE POLICY "Users insert AI logs"
  ON public.dialer_ai_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- 5. SQL function for dashboard metrics (replaces frontend aggregation)
CREATE OR REPLACE FUNCTION public.get_dialer_metrics(_business_id UUID)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  today_start TIMESTAMPTZ;
BEGIN
  today_start := date_trunc('day', now());

  SELECT json_build_object(
    'total_calls', COUNT(*),
    'connected_calls', COUNT(*) FILTER (WHERE call_status IN ('connected','ended') OR (call_duration IS NOT NULL AND call_duration > 0)),
    'failed_calls', COUNT(*) FILTER (WHERE call_status IN ('failed','busy','no-answer')),
    'conversion_count', COUNT(*) FILTER (WHERE disposition = 'converted'),
    'avg_duration', COALESCE(AVG(call_duration) FILTER (WHERE call_duration > 0), 0)::INTEGER,
    'agent_performance', (
      SELECT COALESCE(json_agg(agent_row), '[]'::json)
      FROM (
        SELECT
          ds.user_id AS "userId",
          COALESCE(p.full_name, 'Unknown') AS "agentName",
          COUNT(*) AS calls,
          COUNT(*) FILTER (WHERE ds.call_status IN ('connected','ended') OR (ds.call_duration IS NOT NULL AND ds.call_duration > 0)) AS connected,
          CASE WHEN COUNT(*) > 0 THEN ROUND(COUNT(*) FILTER (WHERE ds.call_status IN ('connected','ended') OR (ds.call_duration IS NOT NULL AND ds.call_duration > 0))::NUMERIC / COUNT(*) * 100) ELSE 0 END AS "connectRate",
          COUNT(*) FILTER (WHERE ds.disposition = 'converted') AS conversions,
          COUNT(*) FILTER (WHERE ds.disposition = 'callback_later') AS "followUps"
        FROM public.dialer_sessions ds
        LEFT JOIN public.profiles p ON p.user_id = ds.user_id
        WHERE ds.business_id = _business_id AND ds.created_at >= today_start
        GROUP BY ds.user_id, p.full_name
      ) agent_row
    )
  )
  INTO result
  FROM public.dialer_sessions
  WHERE business_id = _business_id AND created_at >= today_start;

  RETURN result;
END;
$$;
