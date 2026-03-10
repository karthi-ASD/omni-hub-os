
-- Daily Work Reports table
CREATE TABLE IF NOT EXISTS public.daily_work_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  department_id UUID,
  tasks_assigned INT DEFAULT 0,
  tasks_completed INT DEFAULT 0,
  tasks_pending INT DEFAULT 0,
  calls_made INT DEFAULT 0,
  meetings_conducted INT DEFAULT 0,
  demos_done INT DEFAULT 0,
  tickets_handled INT DEFAULT 0,
  tickets_created INT DEFAULT 0,
  proposals_sent INT DEFAULT 0,
  leads_handled INT DEFAULT 0,
  deals_closed INT DEFAULT 0,
  notes TEXT,
  status TEXT DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, employee_id, report_date)
);

ALTER TABLE public.daily_work_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own DWR" ON public.daily_work_reports
  FOR SELECT USING (
    user_id = auth.uid()
    OR business_id = public.get_user_business_id(auth.uid())
  );

CREATE POLICY "Users can insert own DWR" ON public.daily_work_reports
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND business_id = public.get_user_business_id(auth.uid())
  );

CREATE POLICY "Users can update own DWR" ON public.daily_work_reports
  FOR UPDATE USING (
    user_id = auth.uid()
    AND business_id = public.get_user_business_id(auth.uid())
  );

CREATE TRIGGER set_daily_work_reports_updated_at
  BEFORE UPDATE ON public.daily_work_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_dwr_business_date ON public.daily_work_reports(business_id, report_date);
CREATE INDEX idx_dwr_employee ON public.daily_work_reports(employee_id, report_date);
