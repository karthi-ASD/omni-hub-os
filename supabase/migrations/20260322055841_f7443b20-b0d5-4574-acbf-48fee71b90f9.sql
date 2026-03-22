
-- Live transcript storage
CREATE TABLE public.dialer_transcripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  business_id UUID NOT NULL,
  user_id UUID,
  speaker TEXT NOT NULL DEFAULT 'agent',
  text TEXT NOT NULL,
  timestamp_ms INTEGER NOT NULL DEFAULT 0,
  is_final BOOLEAN NOT NULL DEFAULT false,
  confidence REAL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dialer_transcripts_session ON public.dialer_transcripts(session_id);
CREATE INDEX idx_dialer_transcripts_business ON public.dialer_transcripts(business_id);

-- Finalized full transcript per session
CREATE TABLE public.dialer_call_transcripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL UNIQUE,
  business_id UUID NOT NULL,
  user_id UUID,
  full_transcript TEXT,
  speaker_segments JSONB DEFAULT '[]'::jsonb,
  word_count INTEGER DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  source TEXT DEFAULT 'browser_speech_api',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dialer_call_transcripts_session ON public.dialer_call_transcripts(session_id);
CREATE INDEX idx_dialer_call_transcripts_business ON public.dialer_call_transcripts(business_id);

-- AI coaching events during live calls
CREATE TABLE public.dialer_coaching_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  business_id UUID NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'coaching_tip',
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dialer_coaching_session ON public.dialer_coaching_events(session_id);

-- AI suggestion history
CREATE TABLE public.dialer_ai_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  business_id UUID NOT NULL,
  suggestion_type TEXT NOT NULL DEFAULT 'reply',
  content TEXT NOT NULL,
  was_copied BOOLEAN DEFAULT false,
  was_useful BOOLEAN,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dialer_ai_suggestions_session ON public.dialer_ai_suggestions(session_id);

-- Enable RLS
ALTER TABLE public.dialer_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dialer_call_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dialer_coaching_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dialer_ai_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS policies - authenticated users can read/write their business data
CREATE POLICY "Users can manage their business transcripts" ON public.dialer_transcripts
  FOR ALL TO authenticated
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their business call transcripts" ON public.dialer_call_transcripts
  FOR ALL TO authenticated
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their business coaching events" ON public.dialer_coaching_events
  FOR ALL TO authenticated
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their business AI suggestions" ON public.dialer_ai_suggestions
  FOR ALL TO authenticated
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));
