
-- AI Agent Scripts table
CREATE TABLE public.ai_agent_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  script_name TEXT NOT NULL,
  intro_text TEXT,
  verification_text TEXT,
  qualification_questions_json JSONB DEFAULT '[]'::jsonb,
  scheduling_text TEXT,
  closing_text TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI Voice Call Logs table
CREATE TABLE public.ai_voice_call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES public.ai_agents(id) ON DELETE SET NULL,
  lead_id UUID,
  lead_name TEXT,
  lead_phone TEXT,
  lead_email TEXT,
  website_source TEXT,
  call_status TEXT DEFAULT 'pending',
  call_duration_seconds INTEGER,
  call_outcome TEXT,
  recording_url TEXT,
  transcript TEXT,
  ai_summary TEXT,
  consent_given BOOLEAN DEFAULT false,
  provider TEXT DEFAULT 'elevenlabs',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI Lead Qualifications table
CREATE TABLE public.ai_lead_qualifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  call_log_id UUID REFERENCES public.ai_voice_call_logs(id) ON DELETE CASCADE,
  lead_id UUID,
  lead_name TEXT,
  service_interest TEXT,
  budget_range TEXT,
  timeframe TEXT,
  project_type TEXT,
  requirement_summary TEXT,
  followup_date DATE,
  followup_time TEXT,
  timezone TEXT DEFAULT 'Australia/Sydney',
  ai_summary TEXT,
  lead_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add voice_type and language columns to existing ai_agents table
ALTER TABLE public.ai_agents ADD COLUMN IF NOT EXISTS voice_type TEXT DEFAULT 'professional';
ALTER TABLE public.ai_agents ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en-AU';
ALTER TABLE public.ai_agents ADD COLUMN IF NOT EXISTS script_id UUID REFERENCES public.ai_agent_scripts(id) ON DELETE SET NULL;
ALTER TABLE public.ai_agents ADD COLUMN IF NOT EXISTS ai_provider TEXT DEFAULT 'elevenlabs';
ALTER TABLE public.ai_agents ADD COLUMN IF NOT EXISTS call_timeout_seconds INTEGER DEFAULT 60;
ALTER TABLE public.ai_agents ADD COLUMN IF NOT EXISTS retry_attempts INTEGER DEFAULT 2;

-- RLS
ALTER TABLE public.ai_agent_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_voice_call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_lead_qualifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage scripts in their business" ON public.ai_agent_scripts
  FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Users can manage voice call logs in their business" ON public.ai_voice_call_logs
  FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Users can manage lead qualifications in their business" ON public.ai_lead_qualifications
  FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));
