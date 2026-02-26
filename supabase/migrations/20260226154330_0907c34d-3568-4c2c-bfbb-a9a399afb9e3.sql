
-- Revenue Ledger Entries
CREATE TABLE public.revenue_ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  ledger_scope TEXT NOT NULL DEFAULT 'TENANT_BUSINESS',
  entity_type TEXT NOT NULL DEFAULT 'INVOICE',
  entity_id TEXT,
  customer_type TEXT NOT NULL DEFAULT 'TENANT_CUSTOMER',
  customer_id TEXT,
  service_id TEXT,
  project_id TEXT,
  job_id TEXT,
  amount_gross NUMERIC NOT NULL DEFAULT 0,
  amount_net NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'AUD',
  status TEXT NOT NULL DEFAULT 'PENDING',
  paid_at TIMESTAMPTZ,
  invoice_date DATE,
  due_date DATE,
  provider TEXT,
  transaction_reference TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.revenue_ledger_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_or_super_ledger" ON public.revenue_ledger_entries FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE INDEX idx_ledger_biz_date ON public.revenue_ledger_entries(business_id, invoice_date);

-- Attribution Events
CREATE TABLE public.attribution_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  person_type TEXT NOT NULL DEFAULT 'LEAD',
  person_id TEXT,
  event_type TEXT NOT NULL DEFAULT 'FIRST_TOUCH',
  channel TEXT,
  campaign TEXT,
  adgroup TEXT,
  keyword TEXT,
  meta_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.attribution_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_or_super_attribution" ON public.attribution_events FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Cost Entries
CREATE TABLE public.cost_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  cost_type TEXT NOT NULL DEFAULT 'LABOR',
  linked_entity_type TEXT,
  linked_entity_id TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'AUD',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cost_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_or_super_costs" ON public.cost_entries FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Employee Cost Rates
CREATE TABLE public.employee_cost_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  hourly_rate NUMERIC NOT NULL DEFAULT 0,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.employee_cost_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_or_super_rates" ON public.employee_cost_rates FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Subscription Metrics Daily
CREATE TABLE public.subscription_metrics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  mrr NUMERIC NOT NULL DEFAULT 0,
  arr NUMERIC NOT NULL DEFAULT 0,
  churned_mrr NUMERIC NOT NULL DEFAULT 0,
  new_mrr NUMERIC NOT NULL DEFAULT 0,
  expansion_mrr NUMERIC NOT NULL DEFAULT 0,
  contraction_mrr NUMERIC NOT NULL DEFAULT 0,
  net_mrr_change NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, date)
);
ALTER TABLE public.subscription_metrics_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_or_super_sub_metrics" ON public.subscription_metrics_daily FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Forecast Snapshots
CREATE TABLE public.forecast_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  weighted_pipeline_value NUMERIC NOT NULL DEFAULT 0,
  expected_close_30d NUMERIC NOT NULL DEFAULT 0,
  expected_close_60d NUMERIC NOT NULL DEFAULT 0,
  expected_close_90d NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.forecast_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_or_super_forecast" ON public.forecast_snapshots FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Cohort Memberships
CREATE TABLE public.cohort_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  cohort_type TEXT NOT NULL DEFAULT 'SIGNUP',
  cohort_month TEXT NOT NULL,
  client_id TEXT,
  service_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cohort_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_or_super_cohorts" ON public.cohort_memberships FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Churn Signals
CREATE TABLE public.churn_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL,
  risk_score INT NOT NULL DEFAULT 0,
  reasons_json JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, client_id)
);
ALTER TABLE public.churn_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_or_super_churn" ON public.churn_signals FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

-- Revenue Alert Rules
CREATE TABLE public.revenue_alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL DEFAULT 'REVENUE_DROP',
  threshold_json JSONB,
  recipients_json JSONB,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.revenue_alert_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_or_super_rev_alerts" ON public.revenue_alert_rules FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
