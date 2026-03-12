
-- Cold calling log table
CREATE TABLE public.cold_calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  caller_user_id UUID NOT NULL,
  business_name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  location TEXT,
  industry TEXT,
  call_result TEXT NOT NULL DEFAULT 'no_answer',
  notes TEXT,
  follow_up_date DATE,
  follow_up_time TIME,
  follow_up_type TEXT,
  lead_id UUID REFERENCES public.leads(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cold_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view cold calls in their business"
  ON public.cold_calls FOR SELECT TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert cold calls in their business"
  ON public.cold_calls FOR INSERT TO authenticated
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update cold calls in their business"
  ON public.cold_calls FOR UPDATE TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- Index for performance
CREATE INDEX idx_cold_calls_business_id ON public.cold_calls(business_id);
CREATE INDEX idx_cold_calls_caller ON public.cold_calls(caller_user_id);
CREATE INDEX idx_cold_calls_date ON public.cold_calls(created_at);
CREATE INDEX idx_cold_calls_follow_up ON public.cold_calls(follow_up_date);
