
-- Add client health and SEO hold fields
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS health_score text DEFAULT 'healthy';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS seo_payment_hold boolean DEFAULT false;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS churn_risk text DEFAULT 'low';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS renewal_probability text DEFAULT 'medium';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS commission_rate numeric DEFAULT 10;

-- Sales commissions table
CREATE TABLE public.sales_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  sales_rep_id uuid,
  sales_rep_name text,
  deal_value numeric NOT NULL DEFAULT 0,
  commission_rate numeric NOT NULL DEFAULT 10,
  commission_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  payment_received_at timestamptz,
  approved_at timestamptz,
  approved_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view commissions for their business"
ON public.sales_commissions FOR SELECT TO authenticated
USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert commissions for their business"
ON public.sales_commissions FOR INSERT TO authenticated
WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update commissions for their business"
ON public.sales_commissions FOR UPDATE TO authenticated
USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Super admins full access to commissions"
ON public.sales_commissions FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Client risk alerts table
CREATE TABLE public.client_risk_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  message text NOT NULL,
  is_resolved boolean DEFAULT false,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_risk_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view risk alerts for their business"
ON public.client_risk_alerts FOR SELECT TO authenticated
USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage risk alerts for their business"
ON public.client_risk_alerts FOR ALL TO authenticated
USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));
