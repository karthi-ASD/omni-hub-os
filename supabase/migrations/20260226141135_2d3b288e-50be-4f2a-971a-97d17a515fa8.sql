
-- Stage 6: eWAY Billing tables

-- Enums
DO $$ BEGIN
  CREATE TYPE public.billing_type AS ENUM ('one_time', 'recurring', 'prepaid', 'milestone');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.invoice_type AS ENUM ('one_time', 'recurring', 'milestone', 'prepaid');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.invoice_status AS ENUM ('draft', 'open', 'paid', 'void', 'overdue', 'canceled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_gateway_status AS ENUM ('approved', 'declined', 'failed', 'pending');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.billing_frequency AS ENUM ('monthly', 'yearly');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.recurring_status AS ENUM ('active', 'failed', 'paused', 'canceled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.product_category AS ENUM ('website', 'seo', 'ppc', 'hosting', 'crm', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.gateway_environment AS ENUM ('sandbox', 'live');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.dunning_action AS ENUM ('email', 'notification', 'task', 'suspend');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- billing_accounts
CREATE TABLE IF NOT EXISTS public.billing_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  gateway_provider TEXT NOT NULL DEFAULT 'eway',
  eway_api_key TEXT,
  eway_password TEXT,
  eway_customer_id TEXT,
  environment public.gateway_environment NOT NULL DEFAULT 'sandbox',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.billing_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business admins can manage tenant billing accounts" ON public.billing_accounts FOR ALL
  USING (has_role(auth.uid(), 'business_admin') AND business_id = get_user_business_id(auth.uid()));

CREATE POLICY "Super admins can manage all billing accounts" ON public.billing_accounts FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

-- billing_products
CREATE TABLE IF NOT EXISTS public.billing_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES public.businesses(id),
  name TEXT NOT NULL,
  category public.product_category NOT NULL DEFAULT 'other',
  billing_type public.billing_type NOT NULL DEFAULT 'one_time',
  default_price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'AUD',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.billing_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business users can manage tenant billing products" ON public.billing_products FOR ALL
  USING (business_id = get_user_business_id(auth.uid()) OR business_id IS NULL);

CREATE POLICY "Super admins can manage all billing products" ON public.billing_products FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

-- invoices
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  client_id UUID REFERENCES public.clients(id),
  deal_id UUID REFERENCES public.deals(id),
  project_id UUID REFERENCES public.projects(id),
  invoice_type public.invoice_type NOT NULL DEFAULT 'one_time',
  invoice_number SERIAL,
  status public.invoice_status NOT NULL DEFAULT 'draft',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  amount_due NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'AUD',
  due_date DATE,
  pdf_url TEXT,
  created_by_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business users can manage tenant invoices" ON public.invoices FOR ALL
  USING (business_id = get_user_business_id(auth.uid()));

CREATE POLICY "Super admins can manage all invoices" ON public.invoices FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Clients can view own invoices" ON public.invoices FOR SELECT
  USING (EXISTS (SELECT 1 FROM clients c WHERE c.id = invoices.client_id AND c.user_id = auth.uid()));

-- invoice_items
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  billing_product_id UUID REFERENCES public.billing_products(id),
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_amount NUMERIC NOT NULL DEFAULT 0,
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business users can manage tenant invoice items" ON public.invoice_items FOR ALL
  USING (business_id = get_user_business_id(auth.uid()));

CREATE POLICY "Super admins can manage all invoice items" ON public.invoice_items FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

-- payments
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  client_id UUID REFERENCES public.clients(id),
  invoice_id UUID REFERENCES public.invoices(id),
  subscription_id UUID,
  gateway_provider TEXT NOT NULL DEFAULT 'eway',
  eway_transaction_id TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'AUD',
  status public.payment_gateway_status NOT NULL DEFAULT 'pending',
  receipt_url TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business users can manage tenant payments" ON public.payments FOR ALL
  USING (business_id = get_user_business_id(auth.uid()));

CREATE POLICY "Super admins can manage all payments" ON public.payments FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Clients can view own payments" ON public.payments FOR SELECT
  USING (EXISTS (SELECT 1 FROM clients c WHERE c.id = payments.client_id AND c.user_id = auth.uid()));

-- recurring_profiles
CREATE TABLE IF NOT EXISTS public.recurring_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  client_id UUID REFERENCES public.clients(id),
  billing_product_id UUID REFERENCES public.billing_products(id),
  eway_customer_token TEXT,
  eway_recurring_id TEXT,
  frequency public.billing_frequency NOT NULL DEFAULT 'monthly',
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'AUD',
  next_billing_date DATE,
  status public.recurring_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.recurring_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business users can manage tenant recurring profiles" ON public.recurring_profiles FOR ALL
  USING (business_id = get_user_business_id(auth.uid()));

CREATE POLICY "Super admins can manage all recurring profiles" ON public.recurring_profiles FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

-- gateway_transactions
CREATE TABLE IF NOT EXISTS public.gateway_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  invoice_id UUID REFERENCES public.invoices(id),
  eway_transaction_id TEXT,
  eway_response_code TEXT,
  eway_response_message TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'AUD',
  status public.payment_gateway_status NOT NULL DEFAULT 'pending',
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gateway_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business admins can view tenant gateway transactions" ON public.gateway_transactions FOR ALL
  USING (has_role(auth.uid(), 'business_admin') AND business_id = get_user_business_id(auth.uid()));

CREATE POLICY "Super admins can manage all gateway transactions" ON public.gateway_transactions FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

-- dunning_rules
CREATE TABLE IF NOT EXISTS public.dunning_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  days_offset INTEGER NOT NULL DEFAULT 0,
  action public.dunning_action NOT NULL DEFAULT 'notification',
  message_template TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.dunning_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business admins can manage tenant dunning rules" ON public.dunning_rules FOR ALL
  USING (has_role(auth.uid(), 'business_admin') AND business_id = get_user_business_id(auth.uid()));

CREATE POLICY "Super admins can manage all dunning rules" ON public.dunning_rules FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

-- account_suspensions
CREATE TABLE IF NOT EXISTS public.account_suspensions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  client_id UUID REFERENCES public.clients(id),
  reason TEXT,
  suspended_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reinstated_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.account_suspensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business admins can manage tenant suspensions" ON public.account_suspensions FOR ALL
  USING (has_role(auth.uid(), 'business_admin') AND business_id = get_user_business_id(auth.uid()));

CREATE POLICY "Super admins can manage all suspensions" ON public.account_suspensions FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

-- eway_events (webhook log)
CREATE TABLE IF NOT EXISTS public.eway_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES public.businesses(id),
  eway_reference TEXT,
  payload_json JSONB,
  processed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'received',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.eway_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business admins can view tenant eway events" ON public.eway_events FOR SELECT
  USING (has_role(auth.uid(), 'business_admin') AND business_id = get_user_business_id(auth.uid()));

CREATE POLICY "Super admins can manage all eway events" ON public.eway_events FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

-- communications_log
CREATE TABLE IF NOT EXISTS public.communications_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  client_id UUID REFERENCES public.clients(id),
  channel TEXT NOT NULL DEFAULT 'email',
  subject TEXT,
  body TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.communications_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business users can manage tenant comms log" ON public.communications_log FOR ALL
  USING (business_id = get_user_business_id(auth.uid()));

CREATE POLICY "Super admins can manage all comms log" ON public.communications_log FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

-- Updated_at triggers
CREATE TRIGGER update_billing_accounts_updated_at BEFORE UPDATE ON public.billing_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recurring_profiles_updated_at BEFORE UPDATE ON public.recurring_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
