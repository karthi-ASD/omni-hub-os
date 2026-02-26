
-- =====================================================
-- STAGE 3: Inquiries, Leads, Reminders
-- =====================================================

-- Enums
CREATE TYPE public.inquiry_source AS ENUM ('website_form', 'mobile_app', 'manual', 'other');
CREATE TYPE public.inquiry_channel AS ENUM ('organic', 'google_ads', 'meta_ads', 'referral', 'direct', 'unknown');
CREATE TYPE public.inquiry_status AS ENUM ('new', 'assigned', 'contacted', 'qualified', 'converted_to_lead', 'closed', 'spam');
CREATE TYPE public.preferred_contact AS ENUM ('call', 'email', 'whatsapp');
CREATE TYPE public.lead_source AS ENUM ('inquiry', 'cold_call', 'referral', 'manual', 'other');
CREATE TYPE public.lead_stage AS ENUM ('new', 'contacted', 'meeting_booked', 'proposal_requested', 'negotiation', 'won', 'lost');
CREATE TYPE public.lead_status AS ENUM ('active', 'archived');
CREATE TYPE public.lead_activity_type AS ENUM ('call', 'email', 'whatsapp', 'note', 'meeting', 'status_change');
CREATE TYPE public.reminder_status AS ENUM ('pending', 'done', 'snoozed', 'cancelled', 'overdue');
CREATE TYPE public.reminder_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.reminder_entity_type AS ENUM ('inquiry', 'lead');

-- =====================================================
-- INQUIRIES TABLE
-- =====================================================
CREATE TABLE public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  source inquiry_source NOT NULL DEFAULT 'manual',
  channel inquiry_channel NOT NULL DEFAULT 'unknown',
  landing_page_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  suburb TEXT,
  message TEXT,
  service_interest TEXT,
  preferred_contact_method preferred_contact,
  status inquiry_status NOT NULL DEFAULT 'new',
  assigned_to_user_id UUID,
  lead_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_inquiries_business_id ON public.inquiries(business_id);
CREATE INDEX idx_inquiries_status ON public.inquiries(status);
CREATE INDEX idx_inquiries_assigned ON public.inquiries(assigned_to_user_id);
CREATE INDEX idx_inquiries_created ON public.inquiries(created_at DESC);

-- RLS for inquiries
CREATE POLICY "Super admins can manage all inquiries"
  ON public.inquiries FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Business admins can manage tenant inquiries"
  ON public.inquiries FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'business_admin') AND business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Managers can manage tenant inquiries"
  ON public.inquiries FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'manager') AND business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Employees can view assigned inquiries"
  ON public.inquiries FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'employee') AND assigned_to_user_id = auth.uid());

CREATE POLICY "Employees can update assigned inquiries"
  ON public.inquiries FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'employee') AND assigned_to_user_id = auth.uid());

-- =====================================================
-- LEADS TABLE
-- =====================================================
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  source lead_source NOT NULL DEFAULT 'manual',
  inquiry_id UUID REFERENCES public.inquiries(id),
  assigned_to_user_id UUID,
  name TEXT NOT NULL,
  business_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  suburb TEXT,
  services_needed TEXT,
  estimated_budget NUMERIC,
  notes TEXT,
  stage lead_stage NOT NULL DEFAULT 'new',
  status lead_status NOT NULL DEFAULT 'active',
  next_follow_up_at TIMESTAMPTZ,
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_leads_business_id ON public.leads(business_id);
CREATE INDEX idx_leads_stage ON public.leads(stage);
CREATE INDEX idx_leads_assigned ON public.leads(assigned_to_user_id);
CREATE INDEX idx_leads_follow_up ON public.leads(next_follow_up_at);

-- RLS for leads
CREATE POLICY "Super admins can manage all leads"
  ON public.leads FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Business admins can manage tenant leads"
  ON public.leads FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'business_admin') AND business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Managers can manage tenant leads"
  ON public.leads FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'manager') AND business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Employees can view assigned leads"
  ON public.leads FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'employee') AND assigned_to_user_id = auth.uid());

CREATE POLICY "Employees can update assigned leads"
  ON public.leads FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'employee') AND assigned_to_user_id = auth.uid());

-- =====================================================
-- LEAD ACTIVITIES TABLE
-- =====================================================
CREATE TABLE public.lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  inquiry_id UUID REFERENCES public.inquiries(id) ON DELETE CASCADE,
  actor_user_id UUID NOT NULL,
  type lead_activity_type NOT NULL DEFAULT 'note',
  summary TEXT NOT NULL,
  details_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_lead_activities_lead ON public.lead_activities(lead_id);
CREATE INDEX idx_lead_activities_inquiry ON public.lead_activities(inquiry_id);

CREATE POLICY "Super admins can manage all lead activities"
  ON public.lead_activities FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Business users can manage tenant lead activities"
  ON public.lead_activities FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

-- =====================================================
-- REMINDERS TABLE
-- =====================================================
CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  entity_type reminder_entity_type NOT NULL,
  entity_id UUID NOT NULL,
  assigned_to_user_id UUID NOT NULL,
  title TEXT NOT NULL,
  due_at TIMESTAMPTZ NOT NULL,
  status reminder_status NOT NULL DEFAULT 'pending',
  priority reminder_priority NOT NULL DEFAULT 'medium',
  snoozed_until TIMESTAMPTZ,
  calendar_event_id UUID REFERENCES public.calendar_events(id),
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_reminders_business ON public.reminders(business_id);
CREATE INDEX idx_reminders_assigned ON public.reminders(assigned_to_user_id);
CREATE INDEX idx_reminders_status ON public.reminders(status);
CREATE INDEX idx_reminders_due ON public.reminders(due_at);

CREATE POLICY "Super admins can manage all reminders"
  ON public.reminders FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Business admins can manage tenant reminders"
  ON public.reminders FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'business_admin') AND business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Managers can manage tenant reminders"
  ON public.reminders FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'manager') AND business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Employees can view assigned reminders"
  ON public.reminders FOR SELECT TO authenticated
  USING (assigned_to_user_id = auth.uid());

CREATE POLICY "Employees can update assigned reminders"
  ON public.reminders FOR UPDATE TO authenticated
  USING (assigned_to_user_id = auth.uid());

CREATE POLICY "Authenticated can insert reminders in tenant"
  ON public.reminders FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

-- Updated_at triggers
CREATE TRIGGER update_inquiries_updated_at BEFORE UPDATE ON public.inquiries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON public.reminders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for leads and inquiries
ALTER PUBLICATION supabase_realtime ADD TABLE public.inquiries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reminders;
