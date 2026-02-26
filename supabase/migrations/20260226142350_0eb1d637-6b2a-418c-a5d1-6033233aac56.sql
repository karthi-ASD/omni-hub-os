
-- Payment Gateways table (abstraction layer for multi-gateway support)
CREATE TABLE public.payment_gateways (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  gateway_type TEXT NOT NULL DEFAULT 'eway',
  mode TEXT NOT NULL DEFAULT 'tenant' CHECK (mode IN ('platform', 'tenant')),
  credentials_json TEXT,
  webhook_secret TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Platform Invoices (NextWeb billing its clients/businesses)
CREATE TABLE public.platform_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  invoice_number INTEGER NOT NULL DEFAULT nextval('invoices_invoice_number_seq'::regclass),
  type TEXT NOT NULL DEFAULT 'one_time' CHECK (type IN ('one_time', 'subscription', 'milestone')),
  amount NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'AUD',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'failed', 'overdue')),
  gateway_invoice_reference TEXT,
  description TEXT,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Platform Payments
CREATE TABLE public.platform_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  invoice_id UUID REFERENCES public.platform_invoices(id) ON DELETE SET NULL,
  gateway_type TEXT NOT NULL DEFAULT 'eway',
  gateway_transaction_id TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'AUD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('success', 'failed', 'pending')),
  paid_at TIMESTAMPTZ,
  receipt_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tenant Invoices (each tenant billing their own customers)
CREATE TABLE public.tenant_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'AUD',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'failed')),
  gateway_invoice_reference TEXT,
  description TEXT,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tenant Payments
CREATE TABLE public.tenant_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  invoice_id UUID REFERENCES public.tenant_invoices(id) ON DELETE SET NULL,
  gateway_type TEXT NOT NULL DEFAULT 'eway',
  gateway_transaction_id TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'AUD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('success', 'failed', 'pending')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Gateway Events (webhook logs)
CREATE TABLE public.gateway_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  gateway_type TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'tenant',
  event_type TEXT,
  payload_json JSONB,
  processed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'received',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS on all new tables
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gateway_events ENABLE ROW LEVEL SECURITY;

-- payment_gateways: business admins manage their own, super_admin manages all (including platform)
CREATE POLICY "Business admins manage own gateways" ON public.payment_gateways FOR ALL
  USING (has_role(auth.uid(), 'business_admin'::app_role) AND business_id = get_user_business_id(auth.uid()));
CREATE POLICY "Super admins manage all gateways" ON public.payment_gateways FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- platform_invoices: only super_admin
CREATE POLICY "Super admins manage platform invoices" ON public.platform_invoices FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Business admins view own platform invoices" ON public.platform_invoices FOR SELECT
  USING (has_role(auth.uid(), 'business_admin'::app_role) AND client_business_id = get_user_business_id(auth.uid()));

-- platform_payments: only super_admin + business_admin view own
CREATE POLICY "Super admins manage platform payments" ON public.platform_payments FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Business admins view own platform payments" ON public.platform_payments FOR SELECT
  USING (has_role(auth.uid(), 'business_admin'::app_role) AND client_business_id = get_user_business_id(auth.uid()));

-- tenant_invoices: tenant-scoped
CREATE POLICY "Business users manage tenant invoices" ON public.tenant_invoices FOR ALL
  USING (business_id = get_user_business_id(auth.uid()));
CREATE POLICY "Super admins manage all tenant invoices" ON public.tenant_invoices FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- tenant_payments: tenant-scoped
CREATE POLICY "Business users manage tenant payments" ON public.tenant_payments FOR ALL
  USING (business_id = get_user_business_id(auth.uid()));
CREATE POLICY "Super admins manage all tenant payments" ON public.tenant_payments FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- gateway_events: tenant-scoped + super_admin
CREATE POLICY "Business admins view own gateway events" ON public.gateway_events FOR SELECT
  USING (has_role(auth.uid(), 'business_admin'::app_role) AND business_id = get_user_business_id(auth.uid()));
CREATE POLICY "Super admins manage all gateway events" ON public.gateway_events FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Updated_at triggers
CREATE TRIGGER update_payment_gateways_updated_at BEFORE UPDATE ON public.payment_gateways
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_platform_invoices_updated_at BEFORE UPDATE ON public.platform_invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenant_invoices_updated_at BEFORE UPDATE ON public.tenant_invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
