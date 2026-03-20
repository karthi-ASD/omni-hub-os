
-- QA Reviews table
CREATE TABLE IF NOT EXISTS public.dialer_qa_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.dialer_sessions(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  reviewed_by UUID NOT NULL,
  qa_status TEXT NOT NULL DEFAULT 'pending',
  qa_notes TEXT,
  coaching_notes TEXT,
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, reviewed_by)
);

ALTER TABLE public.dialer_qa_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view QA reviews in their business"
  ON public.dialer_qa_reviews FOR SELECT TO authenticated
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Staff can insert QA reviews in their business"
  ON public.dialer_qa_reviews FOR INSERT TO authenticated
  WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Staff can update own QA reviews"
  ON public.dialer_qa_reviews FOR UPDATE TO authenticated
  USING (reviewed_by = auth.uid());

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_dialer_sessions_user_created ON public.dialer_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dialer_sessions_biz_created ON public.dialer_sessions(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dialer_sessions_recording ON public.dialer_sessions(recording_url) WHERE recording_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dialer_sessions_lead ON public.dialer_sessions(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dialer_ai_logs_session ON public.dialer_ai_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_dialer_dispositions_session ON public.dialer_dispositions(session_id);
CREATE INDEX IF NOT EXISTS idx_dialer_call_tags_session ON public.dialer_call_tags(session_id);

-- Caller metrics function
CREATE OR REPLACE FUNCTION public.get_dialer_caller_metrics(
  _business_id UUID,
  _user_id UUID DEFAULT NULL,
  _date_from TIMESTAMPTZ DEFAULT (now() - interval '1 day'),
  _date_to TIMESTAMPTZ DEFAULT now()
)
RETURNS JSON
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_calls', COUNT(*),
    'connected_calls', COUNT(*) FILTER (WHERE call_status IN ('connected','ended') OR (call_duration IS NOT NULL AND call_duration > 0)),
    'ended_calls', COUNT(*) FILTER (WHERE call_status = 'ended'),
    'failed_calls', COUNT(*) FILTER (WHERE call_status = 'failed'),
    'busy_calls', COUNT(*) FILTER (WHERE call_status = 'busy'),
    'no_answer_calls', COUNT(*) FILTER (WHERE call_status = 'no-answer'),
    'total_talk_time', COALESCE(SUM(call_duration) FILTER (WHERE call_duration > 0), 0)::INTEGER,
    'avg_duration', COALESCE(AVG(call_duration) FILTER (WHERE call_duration > 0), 0)::INTEGER,
    'avg_ai_score', COALESCE(AVG(ai_score) FILTER (WHERE ai_score IS NOT NULL), 0)::INTEGER,
    'recordings_count', COUNT(*) FILTER (WHERE recording_url IS NOT NULL),
    'interested_count', COUNT(*) FILTER (WHERE disposition = 'interested'),
    'converted_count', COUNT(*) FILTER (WHERE disposition = 'converted'),
    'callback_count', COUNT(*) FILTER (WHERE disposition = 'callback_later'),
    'not_interested_count', COUNT(*) FILTER (WHERE disposition = 'not_interested'),
    'wrong_number_count', COUNT(*) FILTER (WHERE disposition = 'wrong_number')
  )
  INTO result
  FROM public.dialer_sessions
  WHERE business_id = _business_id
    AND created_at >= _date_from
    AND created_at < _date_to
    AND (_user_id IS NULL OR user_id = _user_id);
  RETURN result;
END;
$$;

-- Hourly metrics function
CREATE OR REPLACE FUNCTION public.get_dialer_hourly_metrics(
  _business_id UUID,
  _user_id UUID DEFAULT NULL,
  _date_from TIMESTAMPTZ DEFAULT (now() - interval '1 day'),
  _date_to TIMESTAMPTZ DEFAULT now()
)
RETURNS JSON
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT COALESCE(json_agg(row_data ORDER BY hour), '[]'::json)
  INTO result
  FROM (
    SELECT
      EXTRACT(HOUR FROM created_at) AS hour,
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE call_status IN ('connected','ended') OR (call_duration IS NOT NULL AND call_duration > 0)) AS connected,
      COALESCE(SUM(call_duration) FILTER (WHERE call_duration > 0), 0)::INTEGER AS talk_time,
      COALESCE(AVG(call_duration) FILTER (WHERE call_duration > 0), 0)::INTEGER AS avg_duration,
      COUNT(*) FILTER (WHERE disposition = 'converted') AS conversions
    FROM public.dialer_sessions
    WHERE business_id = _business_id
      AND created_at >= _date_from
      AND created_at < _date_to
      AND (_user_id IS NULL OR user_id = _user_id)
    GROUP BY EXTRACT(HOUR FROM created_at)
  ) row_data;
  RETURN result;
END;
$$;

-- Daily metrics function
CREATE OR REPLACE FUNCTION public.get_dialer_daily_metrics(
  _business_id UUID,
  _user_id UUID DEFAULT NULL,
  _date_from TIMESTAMPTZ DEFAULT (now() - interval '30 days'),
  _date_to TIMESTAMPTZ DEFAULT now()
)
RETURNS JSON
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT COALESCE(json_agg(row_data ORDER BY day), '[]'::json)
  INTO result
  FROM (
    SELECT
      date_trunc('day', created_at)::date AS day,
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE call_status IN ('connected','ended') OR (call_duration IS NOT NULL AND call_duration > 0)) AS connected,
      COALESCE(SUM(call_duration) FILTER (WHERE call_duration > 0), 0)::INTEGER AS talk_time,
      COALESCE(AVG(ai_score) FILTER (WHERE ai_score IS NOT NULL), 0)::INTEGER AS avg_ai_score,
      COUNT(*) FILTER (WHERE disposition = 'converted') AS conversions,
      COUNT(*) FILTER (WHERE recording_url IS NOT NULL) AS recordings
    FROM public.dialer_sessions
    WHERE business_id = _business_id
      AND created_at >= _date_from
      AND created_at < _date_to
      AND (_user_id IS NULL OR user_id = _user_id)
    GROUP BY date_trunc('day', created_at)::date
  ) row_data;
  RETURN result;
END;
$$;

-- Team metrics with per-agent breakdown
CREATE OR REPLACE FUNCTION public.get_dialer_team_metrics(
  _business_id UUID,
  _date_from TIMESTAMPTZ DEFAULT (now() - interval '1 day'),
  _date_to TIMESTAMPTZ DEFAULT now()
)
RETURNS JSON
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'summary', (
      SELECT json_build_object(
        'total_calls', COUNT(*),
        'connected_calls', COUNT(*) FILTER (WHERE call_status IN ('connected','ended') OR (call_duration IS NOT NULL AND call_duration > 0)),
        'total_talk_time', COALESCE(SUM(call_duration) FILTER (WHERE call_duration > 0), 0)::INTEGER,
        'avg_ai_score', COALESCE(AVG(ai_score) FILTER (WHERE ai_score IS NOT NULL), 0)::INTEGER,
        'recordings_count', COUNT(*) FILTER (WHERE recording_url IS NOT NULL),
        'conversions', COUNT(*) FILTER (WHERE disposition = 'converted'),
        'active_callers', COUNT(DISTINCT user_id)
      )
      FROM public.dialer_sessions
      WHERE business_id = _business_id AND created_at >= _date_from AND created_at < _date_to
    ),
    'agents', (
      SELECT COALESCE(json_agg(agent_row ORDER BY total DESC), '[]'::json)
      FROM (
        SELECT
          ds.user_id,
          COALESCE(p.full_name, 'Unknown') AS agent_name,
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE ds.call_status IN ('connected','ended') OR (ds.call_duration IS NOT NULL AND ds.call_duration > 0)) AS connected,
          COALESCE(SUM(ds.call_duration) FILTER (WHERE ds.call_duration > 0), 0)::INTEGER AS talk_time,
          COALESCE(AVG(ds.call_duration) FILTER (WHERE ds.call_duration > 0), 0)::INTEGER AS avg_duration,
          COALESCE(AVG(ds.ai_score) FILTER (WHERE ds.ai_score IS NOT NULL), 0)::INTEGER AS avg_ai_score,
          COUNT(*) FILTER (WHERE ds.disposition = 'interested') AS interested,
          COUNT(*) FILTER (WHERE ds.disposition = 'converted') AS converted,
          COUNT(*) FILTER (WHERE ds.disposition = 'callback_later') AS callbacks,
          COUNT(*) FILTER (WHERE ds.disposition = 'not_interested') AS not_interested,
          COUNT(*) FILTER (WHERE ds.call_status = 'no-answer') AS no_answer,
          COUNT(*) FILTER (WHERE ds.call_status = 'failed') AS failed,
          COUNT(*) FILTER (WHERE ds.call_status = 'busy') AS busy
        FROM public.dialer_sessions ds
        LEFT JOIN public.profiles p ON p.user_id = ds.user_id
        WHERE ds.business_id = _business_id AND ds.created_at >= _date_from AND ds.created_at < _date_to
        GROUP BY ds.user_id, p.full_name
      ) agent_row
    )
  )
  INTO result;
  RETURN result;
END;
$$;
