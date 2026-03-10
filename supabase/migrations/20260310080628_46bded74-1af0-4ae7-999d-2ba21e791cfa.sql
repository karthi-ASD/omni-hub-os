
-- Internal tickets table
CREATE TABLE public.internal_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  ticket_number TEXT NOT NULL DEFAULT ('INT-' || floor(random() * 900000 + 100000)::text),
  title TEXT NOT NULL,
  description TEXT,
  department TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  created_by_user_id UUID NOT NULL,
  assigned_to_user_id UUID,
  resolved_by_user_id UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.internal_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view internal tickets in their business"
  ON public.internal_tickets FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Managers can create internal tickets"
  ON public.internal_tickets FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Admins can update internal tickets"
  ON public.internal_tickets FOR UPDATE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

-- Internal ticket comments table
CREATE TABLE public.internal_ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.internal_tickets(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  user_name TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.internal_ticket_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view internal ticket comments"
  ON public.internal_ticket_comments FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Users can create internal ticket comments"
  ON public.internal_ticket_comments FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

-- AI autonomous tasks table
CREATE TABLE public.ai_autonomous_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  task_type TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  description TEXT,
  department TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  ai_confidence NUMERIC DEFAULT 0,
  source_module TEXT,
  assigned_department TEXT,
  auto_created BOOLEAN DEFAULT true,
  approved_by_user_id UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_autonomous_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view AI tasks in their business"
  ON public.ai_autonomous_tasks FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "System can insert AI tasks"
  ON public.ai_autonomous_tasks FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Admins can update AI tasks"
  ON public.ai_autonomous_tasks FOR UPDATE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

-- AI content opportunities table
CREATE TABLE public.ai_content_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  client_id UUID,
  keyword TEXT NOT NULL,
  search_volume INTEGER DEFAULT 0,
  competition TEXT DEFAULT 'medium',
  opportunity_type TEXT NOT NULL DEFAULT 'landing_page',
  recommendation TEXT,
  status TEXT NOT NULL DEFAULT 'suggested',
  ai_confidence NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_content_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view content opportunities"
  ON public.ai_content_opportunities FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "System can insert content opportunities"
  ON public.ai_content_opportunities FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

-- AI email drafts table
CREATE TABLE public.ai_email_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  client_id UUID,
  draft_type TEXT NOT NULL DEFAULT 'report',
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_email_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view email drafts"
  ON public.ai_email_drafts FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "System can insert email drafts"
  ON public.ai_email_drafts FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Users can update email drafts"
  ON public.ai_email_drafts FOR UPDATE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

-- Enable realtime for internal tickets
ALTER PUBLICATION supabase_realtime ADD TABLE public.internal_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.internal_ticket_comments;
