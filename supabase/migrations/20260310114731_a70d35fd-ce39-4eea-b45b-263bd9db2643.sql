
-- ============================================================
-- NEXTWEB OS – MASTER DATABASE EXTENSION
-- Adds missing enterprise CRM tables without touching existing ones
-- ============================================================

-- 1. ACCOUNTS (Salesforce-style company records, extends clients)
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  account_code TEXT,
  company_name TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  country TEXT,
  state TEXT,
  city TEXT,
  address TEXT,
  company_size TEXT,
  primary_contact_id UUID,
  assigned_account_manager_id UUID,
  account_status TEXT NOT NULL DEFAULT 'prospect',
  lead_source TEXT,
  total_revenue NUMERIC DEFAULT 0,
  renewal_date DATE,
  created_from_lead_id UUID,
  created_from_client_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. CONTACTS (individuals linked to accounts)
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  contact_code TEXT,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  designation TEXT,
  department_name TEXT,
  email TEXT,
  phone TEXT,
  alternate_phone TEXT,
  linkedin_url TEXT,
  decision_maker_flag BOOLEAN DEFAULT false,
  influence_level TEXT DEFAULT 'standard',
  relationship_type TEXT DEFAULT 'primary',
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. CONTACT RELATIONSHIPS (hierarchy between contacts)
CREATE TABLE IF NOT EXISTS public.contact_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  parent_contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  child_contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  relationship_label TEXT DEFAULT 'reports_to',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. LEAD NOTES
CREATE TABLE IF NOT EXISTS public.lead_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID,
  note_type TEXT DEFAULT 'general',
  note_content TEXT NOT NULL,
  internal_only BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. LEAD CALLS (detailed call log for sales)
CREATE TABLE IF NOT EXISTS public.lead_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  agent_id UUID,
  call_datetime TIMESTAMPTZ DEFAULT now(),
  call_type TEXT DEFAULT 'outbound',
  direction TEXT DEFAULT 'outbound',
  duration_seconds INTEGER DEFAULT 0,
  outcome TEXT,
  call_summary TEXT,
  recording_file TEXT,
  recording_url TEXT,
  recording_reference TEXT,
  transcript_text TEXT,
  next_action TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. CALLBACKS
CREATE TABLE IF NOT EXISTS public.callbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  opportunity_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  assigned_agent_id UUID,
  callback_date DATE NOT NULL,
  callback_time TIME,
  callback_reason TEXT,
  priority TEXT DEFAULT 'medium',
  notes TEXT,
  status TEXT DEFAULT 'pending',
  created_by UUID,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. FOLLOWUPS
CREATE TABLE IF NOT EXISTS public.followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  opportunity_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  assigned_agent_id UUID,
  followup_date DATE NOT NULL,
  followup_time TIME,
  followup_type TEXT DEFAULT 'call',
  subject TEXT,
  notes TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  created_by UUID,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. MEETINGS
CREATE TABLE IF NOT EXISTS public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  assigned_agent_id UUID,
  meeting_type TEXT DEFAULT 'office_meeting',
  meeting_date DATE NOT NULL,
  meeting_time TIME,
  meeting_platform TEXT,
  meeting_link TEXT,
  meeting_location TEXT,
  objective TEXT,
  outcome TEXT,
  notes TEXT,
  invite_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. FIELD VISITS
CREATE TABLE IF NOT EXISTS public.field_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  assigned_agent_id UUID,
  visit_date DATE NOT NULL,
  visit_time TIME,
  visit_address TEXT,
  agenda TEXT,
  visit_outcome TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. DEMOS
CREATE TABLE IF NOT EXISTS public.demos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  assigned_agent_id UUID,
  demo_type TEXT DEFAULT 'product',
  demo_date DATE NOT NULL,
  demo_time TIME,
  platform TEXT,
  outcome TEXT,
  notes TEXT,
  followup_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. OPPORTUNITY STAGE HISTORY (extends deals)
CREATE TABLE IF NOT EXISTS public.opportunity_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  old_stage TEXT,
  new_stage TEXT NOT NULL,
  changed_by UUID,
  notes TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. PROPOSAL LINE ITEMS
CREATE TABLE IF NOT EXISTS public.proposal_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  description TEXT,
  quantity NUMERIC DEFAULT 1,
  unit_price NUMERIC DEFAULT 0,
  total_price NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. APPROVALS (generic approval engine)
CREATE TABLE IF NOT EXISTS public.approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  approval_type TEXT NOT NULL,
  requested_by UUID,
  assigned_to UUID,
  status TEXT DEFAULT 'pending',
  request_notes TEXT,
  decision_notes TEXT,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. ONBOARDING WORKFLOWS
CREATE TABLE IF NOT EXISTS public.onboarding_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  assigned_account_manager_id UUID,
  onboarding_status TEXT DEFAULT 'pending',
  start_date DATE,
  target_completion_date DATE,
  completed_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 15. ONBOARDING TASKS
CREATE TABLE IF NOT EXISTS public.onboarding_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES public.onboarding_workflows(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  assigned_to UUID,
  task_title TEXT NOT NULL,
  task_description TEXT,
  priority TEXT DEFAULT 'medium',
  due_date DATE,
  status TEXT DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 16. DEPARTMENT HANDOFFS
CREATE TABLE IF NOT EXISTS public.department_handoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  source_department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  target_department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  source_user_id UUID,
  target_user_id UUID,
  handoff_type TEXT DEFAULT 'project',
  handoff_notes TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 17. TICKET STATUS HISTORY
CREATE TABLE IF NOT EXISTS public.ticket_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID,
  notes TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 18. TICKET EMAIL LOGS
CREATE TABLE IF NOT EXISTS public.ticket_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  recipient_email TEXT,
  subject TEXT,
  body_snapshot TEXT,
  sent_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'sent'
);

-- 19. EMAIL MESSAGES (unified inbox)
CREATE TABLE IF NOT EXISTS public.email_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  external_message_id TEXT,
  thread_id TEXT,
  mailbox TEXT,
  sender_name TEXT,
  sender_email TEXT,
  recipient_email TEXT,
  cc_email TEXT,
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  message_type TEXT DEFAULT 'inbound',
  linked_lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  linked_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  linked_contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  linked_ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE SET NULL,
  linked_opportunity_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  received_at TIMESTAMPTZ,
  processed_status TEXT DEFAULT 'unprocessed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 20. PERMISSION REQUESTS (HR)
CREATE TABLE IF NOT EXISTS public.permission_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  permission_type TEXT NOT NULL DEFAULT 'short_leave',
  request_date DATE NOT NULL,
  from_time TIME,
  to_time TIME,
  reason TEXT,
  manager_approval_status TEXT DEFAULT 'pending',
  hr_approval_status TEXT DEFAULT 'pending',
  final_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 21. EMPLOYEE ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS public.employee_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  module_name TEXT,
  record_id TEXT,
  activity_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 22. TRAINER FEEDBACK
CREATE TABLE IF NOT EXISTS public.trainer_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  employee_user_id UUID NOT NULL,
  trainer_user_id UUID NOT NULL,
  related_call_id UUID,
  related_ticket_id UUID,
  feedback_type TEXT DEFAULT 'coaching',
  feedback_text TEXT,
  score NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 23. EMPLOYEE PERFORMANCE DAILY
CREATE TABLE IF NOT EXISTS public.employee_performance_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  stat_date DATE NOT NULL,
  leads_handled INTEGER DEFAULT 0,
  calls_logged INTEGER DEFAULT 0,
  callbacks_due INTEGER DEFAULT 0,
  callbacks_completed INTEGER DEFAULT 0,
  callbacks_missed INTEGER DEFAULT 0,
  followups_completed INTEGER DEFAULT 0,
  meetings_done INTEGER DEFAULT 0,
  demos_done INTEGER DEFAULT 0,
  proposals_sent INTEGER DEFAULT 0,
  deals_closed INTEGER DEFAULT 0,
  revenue_closed NUMERIC DEFAULT 0,
  tickets_opened INTEGER DEFAULT 0,
  tickets_followed_up INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, stat_date)
);

-- 24. EMPLOYEE PERFORMANCE MONTHLY
CREATE TABLE IF NOT EXISTS public.employee_performance_monthly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  stat_month INTEGER NOT NULL,
  stat_year INTEGER NOT NULL,
  leads_handled INTEGER DEFAULT 0,
  calls_logged INTEGER DEFAULT 0,
  meetings_done INTEGER DEFAULT 0,
  demos_done INTEGER DEFAULT 0,
  proposals_sent INTEGER DEFAULT 0,
  deals_closed INTEGER DEFAULT 0,
  revenue_closed NUMERIC DEFAULT 0,
  conversion_rate NUMERIC DEFAULT 0,
  callback_compliance_rate NUMERIC DEFAULT 0,
  ticket_handling_score NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, stat_month, stat_year)
);

-- 25. RENEWALS
CREATE TABLE IF NOT EXISTS public.renewals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  renewal_due_date DATE,
  renewal_status TEXT DEFAULT 'upcoming',
  renewal_value NUMERIC DEFAULT 0,
  assigned_to UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 26. UPSELL OPPORTUNITIES
CREATE TABLE IF NOT EXISTS public.upsell_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  created_from_contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  service_suggested TEXT,
  opportunity_value NUMERIC DEFAULT 0,
  stage TEXT DEFAULT 'identified',
  assigned_to UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 27. CUSTOMER FEEDBACK (CSAT)
CREATE TABLE IF NOT EXISTS public.customer_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE SET NULL,
  feedback_type TEXT DEFAULT 'ticket_closure',
  score NUMERIC,
  comments TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now()
);

-- 28. ACCOUNT TIMELINE (central activity feed)
CREATE TABLE IF NOT EXISTS public.account_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  opportunity_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE SET NULL,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  user_id UUID,
  event_type TEXT NOT NULL,
  event_title TEXT NOT NULL,
  event_description TEXT,
  module_name TEXT,
  module_record_id TEXT,
  visibility TEXT DEFAULT 'internal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 29. OPPORTUNITY COMPETITOR TRACKING
CREATE TABLE IF NOT EXISTS public.opportunity_competitor_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  competitor_name TEXT NOT NULL,
  competitor_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Enable RLS on all new tables
-- ============================================================
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.callbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_handoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_performance_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_performance_monthly ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renewals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upsell_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_competitor_tracking ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policies (business_id tenant isolation via security definer)
-- ============================================================

-- Helper: reuse existing get_user_business_id function
-- All policies follow same pattern: user can access rows matching their business_id

CREATE POLICY "tenant_isolation" ON public.accounts FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "tenant_isolation" ON public.contacts FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "tenant_isolation" ON public.contact_relationships FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "tenant_isolation" ON public.lead_notes FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "tenant_isolation" ON public.lead_calls FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "tenant_isolation" ON public.callbacks FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "tenant_isolation" ON public.followups FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "tenant_isolation" ON public.meetings FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "tenant_isolation" ON public.field_visits FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "tenant_isolation" ON public.demos FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "tenant_isolation" ON public.opportunity_stage_history FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "tenant_isolation" ON public.proposal_line_items FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "tenant_isolation" ON public.approvals FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "tenant_isolation" ON public.onboarding_workflows FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "tenant_isolation" ON public.onboarding_tasks FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "tenant_isolation" ON public.department_handoffs FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "tenant_isolation" ON public.ticket_status_history FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "tenant_isolation" ON public.ticket_email_logs FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "tenant_isolation" ON public.email_messages FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "tenant_isolation" ON public.permission_requests FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "tenant_isolation" ON public.employee_activity_logs FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "tenant_isolation" ON public.trainer_feedback FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "tenant_isolation" ON public.employee_performance_daily FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "tenant_isolation" ON public.employee_performance_monthly FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "tenant_isolation" ON public.renewals FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "tenant_isolation" ON public.upsell_opportunities FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "tenant_isolation" ON public.customer_feedback FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "tenant_isolation" ON public.account_timeline FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "tenant_isolation" ON public.opportunity_competitor_tracking FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

-- ============================================================
-- Indexes for performance
-- ============================================================
CREATE INDEX idx_accounts_business ON public.accounts(business_id);
CREATE INDEX idx_contacts_business ON public.contacts(business_id);
CREATE INDEX idx_contacts_account ON public.contacts(account_id);
CREATE INDEX idx_lead_notes_lead ON public.lead_notes(lead_id);
CREATE INDEX idx_lead_calls_lead ON public.lead_calls(lead_id);
CREATE INDEX idx_callbacks_business ON public.callbacks(business_id);
CREATE INDEX idx_callbacks_agent ON public.callbacks(assigned_agent_id);
CREATE INDEX idx_followups_business ON public.followups(business_id);
CREATE INDEX idx_followups_agent ON public.followups(assigned_agent_id);
CREATE INDEX idx_meetings_business ON public.meetings(business_id);
CREATE INDEX idx_opp_stage_history ON public.opportunity_stage_history(opportunity_id);
CREATE INDEX idx_onboarding_wf_business ON public.onboarding_workflows(business_id);
CREATE INDEX idx_onboarding_tasks_wf ON public.onboarding_tasks(workflow_id);
CREATE INDEX idx_ticket_status_history ON public.ticket_status_history(ticket_id);
CREATE INDEX idx_email_messages_business ON public.email_messages(business_id);
CREATE INDEX idx_renewals_business ON public.renewals(business_id);
CREATE INDEX idx_renewals_due ON public.renewals(renewal_due_date);
CREATE INDEX idx_upsell_business ON public.upsell_opportunities(business_id);
CREATE INDEX idx_account_timeline_account ON public.account_timeline(account_id);
CREATE INDEX idx_account_timeline_client ON public.account_timeline(client_id);
CREATE INDEX idx_account_timeline_business ON public.account_timeline(business_id);
CREATE INDEX idx_perf_daily_user ON public.employee_performance_daily(user_id, stat_date);
CREATE INDEX idx_perf_monthly_user ON public.employee_performance_monthly(user_id, stat_year, stat_month);
CREATE INDEX idx_trainer_feedback_emp ON public.trainer_feedback(employee_user_id);

-- ============================================================
-- Enable realtime for key tables
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.account_timeline;
ALTER PUBLICATION supabase_realtime ADD TABLE public.callbacks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.followups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.renewals;

-- ============================================================
-- Updated_at triggers
-- ============================================================
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_callbacks_updated_at BEFORE UPDATE ON public.callbacks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_followups_updated_at BEFORE UPDATE ON public.followups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON public.meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_field_visits_updated_at BEFORE UPDATE ON public.field_visits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_demos_updated_at BEFORE UPDATE ON public.demos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_approvals_updated_at BEFORE UPDATE ON public.approvals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_onboarding_wf_updated_at BEFORE UPDATE ON public.onboarding_workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_onboarding_tasks_updated_at BEFORE UPDATE ON public.onboarding_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dept_handoffs_updated_at BEFORE UPDATE ON public.department_handoffs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_permission_reqs_updated_at BEFORE UPDATE ON public.permission_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_renewals_updated_at BEFORE UPDATE ON public.renewals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_upsell_updated_at BEFORE UPDATE ON public.upsell_opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_perf_daily_updated_at BEFORE UPDATE ON public.employee_performance_daily FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_perf_monthly_updated_at BEFORE UPDATE ON public.employee_performance_monthly FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
