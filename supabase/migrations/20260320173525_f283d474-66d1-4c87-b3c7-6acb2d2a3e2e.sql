
-- Add dialer_enabled flag to clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS dialer_enabled BOOLEAN DEFAULT FALSE;

-- Create dialer_dispositions table
CREATE TABLE IF NOT EXISTS public.dialer_dispositions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.dialer_sessions(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  agent_id UUID NOT NULL,
  disposition_type TEXT NOT NULL,
  notes TEXT,
  follow_up_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create dialer_call_tags table
CREATE TABLE IF NOT EXISTS public.dialer_call_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.dialer_sessions(id) ON DELETE CASCADE NOT NULL,
  tag TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.dialer_dispositions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dialer_call_tags ENABLE ROW LEVEL SECURITY;

-- RLS for dialer_dispositions
CREATE POLICY "Users can view dispositions in their business" ON public.dialer_dispositions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.dialer_sessions ds
      JOIN public.profiles p ON p.business_id = ds.business_id
      WHERE ds.id = dialer_dispositions.session_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own dispositions" ON public.dialer_dispositions
  FOR INSERT TO authenticated
  WITH CHECK (agent_id = auth.uid());

-- RLS for dialer_call_tags
CREATE POLICY "Users can view tags in their business" ON public.dialer_call_tags
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.dialer_sessions ds
      JOIN public.profiles p ON p.business_id = ds.business_id
      WHERE ds.id = dialer_call_tags.session_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert tags" ON public.dialer_call_tags
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Enable realtime for dialer_dispositions
ALTER PUBLICATION supabase_realtime ADD TABLE public.dialer_dispositions;
