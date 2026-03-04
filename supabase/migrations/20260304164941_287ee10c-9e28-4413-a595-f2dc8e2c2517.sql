
-- Stage 23: AI Multi-Channel Autopilot tables

-- 1) autopilot_settings
CREATE TABLE public.autopilot_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT false,
  allowed_channels jsonb DEFAULT '["email","sms","whatsapp"]'::jsonb,
  quiet_hours_start time DEFAULT '21:00',
  quiet_hours_end time DEFAULT '08:00',
  timezone text DEFAULT 'Australia/Sydney',
  max_messages_per_day int DEFAULT 3,
  max_messages_per_week int DEFAULT 10,
  escalation_enabled boolean DEFAULT false,
  default_owner_role text DEFAULT 'SALES',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(business_id)
);

-- 2) lead_conversations
CREATE TABLE public.lead_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  lead_id uuid,
  inquiry_id uuid,
  status text NOT NULL DEFAULT 'OPEN',
  mode text NOT NULL DEFAULT 'AUTOPILOT',
  last_message_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3) autopilot_sequences
CREATE TABLE public.autopilot_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  purpose text NOT NULL DEFAULT 'NEW_LEAD',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 4) autopilot_steps
CREATE TABLE public.autopilot_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
  sequence_id uuid NOT NULL REFERENCES public.autopilot_sequences(id) ON DELETE CASCADE,
  step_order int NOT NULL DEFAULT 1,
  delay_minutes int NOT NULL DEFAULT 0,
  channel text NOT NULL DEFAULT 'EMAIL',
  template_id uuid,
  ai_enabled boolean DEFAULT false,
  stop_if_replied boolean DEFAULT true,
  stop_if_booked boolean DEFAULT true
);

-- 5) autopilot_runs
CREATE TABLE public.autopilot_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.lead_conversations(id),
  lead_id uuid,
  sequence_id uuid REFERENCES public.autopilot_sequences(id),
  current_step_order int DEFAULT 0,
  next_step_at timestamptz,
  status text NOT NULL DEFAULT 'RUNNING',
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  failure_reason text,
  created_at timestamptz DEFAULT now()
);

-- 6) autopilot_rate_limits
CREATE TABLE public.autopilot_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  sent_count int DEFAULT 0,
  week_key text,
  week_count int DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(business_id, lead_id, date)
);

-- 7) escalation_rules
CREATE TABLE public.escalation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  trigger_type text NOT NULL DEFAULT 'LEAD_NOT_CONTACTED',
  sla_minutes int NOT NULL DEFAULT 60,
  escalate_to_role text NOT NULL DEFAULT 'MANAGER',
  notify_channels jsonb DEFAULT '["email"]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 8) ai_conversation_insights
CREATE TABLE public.ai_conversation_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.lead_conversations(id),
  lead_id uuid,
  intent text,
  urgency_score int,
  summary text,
  suggested_reply text,
  suggested_next_action text,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.autopilot_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autopilot_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autopilot_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autopilot_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autopilot_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversation_insights ENABLE ROW LEVEL SECURITY;

-- RLS policies (tenant isolation)
CREATE POLICY "tenant_autopilot_settings" ON public.autopilot_settings FOR ALL TO authenticated USING (business_id = public.get_user_business_id(auth.uid())) WITH CHECK (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "tenant_lead_conversations" ON public.lead_conversations FOR ALL TO authenticated USING (business_id = public.get_user_business_id(auth.uid())) WITH CHECK (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "tenant_autopilot_sequences" ON public.autopilot_sequences FOR ALL TO authenticated USING (business_id = public.get_user_business_id(auth.uid()) OR business_id IS NULL) WITH CHECK (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "tenant_autopilot_steps" ON public.autopilot_steps FOR ALL TO authenticated USING (business_id = public.get_user_business_id(auth.uid()) OR business_id IS NULL) WITH CHECK (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "tenant_autopilot_runs" ON public.autopilot_runs FOR ALL TO authenticated USING (business_id = public.get_user_business_id(auth.uid())) WITH CHECK (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "tenant_autopilot_rate_limits" ON public.autopilot_rate_limits FOR ALL TO authenticated USING (business_id = public.get_user_business_id(auth.uid())) WITH CHECK (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "tenant_escalation_rules" ON public.escalation_rules FOR ALL TO authenticated USING (business_id = public.get_user_business_id(auth.uid())) WITH CHECK (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "tenant_ai_conversation_insights" ON public.ai_conversation_insights FOR ALL TO authenticated USING (business_id = public.get_user_business_id(auth.uid())) WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

-- Indexes
CREATE INDEX idx_lead_conversations_business ON public.lead_conversations(business_id, lead_id, created_at);
CREATE INDEX idx_autopilot_runs_business ON public.autopilot_runs(business_id, lead_id, status);
CREATE INDEX idx_autopilot_runs_next_step ON public.autopilot_runs(status, next_step_at);
CREATE INDEX idx_ai_insights_conv ON public.ai_conversation_insights(business_id, conversation_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.autopilot_runs;

-- updated_at triggers
CREATE TRIGGER set_updated_at_autopilot_settings BEFORE UPDATE ON public.autopilot_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_updated_at_lead_conversations BEFORE UPDATE ON public.lead_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
