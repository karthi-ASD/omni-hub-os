
-- Broadcast polls table
CREATE TABLE public.broadcast_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_id UUID NOT NULL REFERENCES public.daily_insights(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Poll options
CREATE TABLE public.broadcast_poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.broadcast_polls(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Poll votes (one per employee per poll)
CREATE TABLE public.broadcast_poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.broadcast_polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.broadcast_poll_options(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  voted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(poll_id, employee_id)
);

-- Enable RLS
ALTER TABLE public.broadcast_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_poll_votes ENABLE ROW LEVEL SECURITY;

-- RLS policies for broadcast_polls
CREATE POLICY "Users can view polls in their business" ON public.broadcast_polls
  FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Admins can insert polls" ON public.broadcast_polls
  FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Admins can delete polls" ON public.broadcast_polls
  FOR DELETE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

-- RLS policies for broadcast_poll_options
CREATE POLICY "Users can view poll options" ON public.broadcast_poll_options
  FOR SELECT TO authenticated
  USING (poll_id IN (SELECT id FROM public.broadcast_polls WHERE business_id = public.get_user_business_id(auth.uid())));

CREATE POLICY "Admins can insert poll options" ON public.broadcast_poll_options
  FOR INSERT TO authenticated
  WITH CHECK (poll_id IN (SELECT id FROM public.broadcast_polls WHERE business_id = public.get_user_business_id(auth.uid())));

-- RLS policies for broadcast_poll_votes
CREATE POLICY "Users can view votes in their business" ON public.broadcast_poll_votes
  FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Users can vote" ON public.broadcast_poll_votes
  FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) AND employee_id = auth.uid());
