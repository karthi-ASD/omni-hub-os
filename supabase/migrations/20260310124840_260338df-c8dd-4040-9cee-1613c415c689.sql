
-- Xero sync tracking
CREATE TABLE public.xero_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL, -- contacts, invoices, payments, credit_notes
  status TEXT NOT NULL DEFAULT 'pending', -- pending, success, failed
  records_synced INT DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Xero OAuth tokens
CREATE TABLE public.xero_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE UNIQUE,
  xero_tenant_id TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  redirect_url TEXT,
  is_connected BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Xero invoices (read-only mirror)
CREATE TABLE public.xero_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  xero_invoice_id TEXT NOT NULL,
  invoice_number TEXT,
  client_id UUID REFERENCES public.clients(id),
  xero_contact_id TEXT,
  contact_name TEXT,
  invoice_date DATE,
  due_date DATE,
  currency TEXT DEFAULT 'AUD',
  total_amount NUMERIC(12,2) DEFAULT 0,
  amount_paid NUMERIC(12,2) DEFAULT 0,
  amount_due NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'DRAFT', -- DRAFT, SUBMITTED, AUTHORISED, PAID, OVERDUE, VOID
  reference TEXT,
  line_items_json JSONB,
  department_category TEXT, -- SEO, Web Dev, App Dev, Ads, Hosting, etc.
  synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, xero_invoice_id)
);

-- Xero payments (read-only mirror)
CREATE TABLE public.xero_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  xero_payment_id TEXT NOT NULL,
  xero_invoice_id TEXT,
  invoice_id UUID REFERENCES public.xero_invoices(id),
  client_id UUID REFERENCES public.clients(id),
  payment_amount NUMERIC(12,2) DEFAULT 0,
  payment_date DATE,
  payment_method TEXT,
  transaction_reference TEXT,
  synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, xero_payment_id)
);

-- Agency expenses (manual entry for profit calculations)
CREATE TABLE public.agency_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- salary, rent, software, marketing, utilities, other
  department TEXT, -- SEO, Web Dev, etc.
  description TEXT,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT, -- monthly, quarterly, yearly
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Client billing schedules (monitoring only)
CREATE TABLE public.client_billing_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  monthly_fee NUMERIC(12,2) DEFAULT 0,
  billing_cycle TEXT DEFAULT 'monthly', -- monthly, quarterly, yearly
  contract_start_date DATE,
  contract_end_date DATE,
  next_billing_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add xero_contact_id to clients if not exists
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS xero_contact_id TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS tax_number TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS billing_address TEXT;

-- RLS
ALTER TABLE public.xero_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xero_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xero_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xero_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_billing_schedules ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own business xero sync logs" ON public.xero_sync_logs FOR ALL TO authenticated
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own business xero connections" ON public.xero_connections FOR ALL TO authenticated
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view own business xero invoices" ON public.xero_invoices FOR ALL TO authenticated
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view own business xero payments" ON public.xero_payments FOR ALL TO authenticated
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own business expenses" ON public.agency_expenses FOR ALL TO authenticated
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own business billing schedules" ON public.client_billing_schedules FOR ALL TO authenticated
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));
