
-- Sales Callbacks table
CREATE TABLE public.sales_callbacks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  sales_user_id UUID NOT NULL,
  callback_date DATE NOT NULL,
  callback_time TEXT,
  notes TEXT,
  result TEXT,
  next_step TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_callbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business callbacks" ON public.sales_callbacks
  FOR SELECT USING (
    business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own business callbacks" ON public.sales_callbacks
  FOR INSERT WITH CHECK (
    business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own business callbacks" ON public.sales_callbacks
  FOR UPDATE USING (
    business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid())
  );

-- Client Conversations table
CREATE TABLE public.client_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  sales_user_id UUID NOT NULL,
  conversation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  conversation_type TEXT NOT NULL DEFAULT 'call',
  notes TEXT,
  next_callback_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business conversations" ON public.client_conversations
  FOR SELECT USING (
    business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own business conversations" ON public.client_conversations
  FOR INSERT WITH CHECK (
    business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid())
  );

-- Add created_by to clients if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'created_by') THEN
    ALTER TABLE public.clients ADD COLUMN created_by UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'signup_source') THEN
    ALTER TABLE public.clients ADD COLUMN signup_source TEXT DEFAULT 'manual';
  END IF;
END $$;

-- Enable realtime for callbacks
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales_callbacks;
