
-- Create xero_expenses table for syncing expenses from Xero
CREATE TABLE public.xero_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  xero_expense_id TEXT NOT NULL,
  expense_date TEXT,
  supplier_name TEXT,
  category TEXT,
  description TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'AUD',
  status TEXT DEFAULT 'AUTHORISED',
  line_items_json JSONB,
  synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, xero_expense_id)
);

ALTER TABLE public.xero_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view expenses for their business"
  ON public.xero_expenses FOR SELECT TO authenticated
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- Add client_since column to clients table
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS client_since DATE;

-- Add xero_contact_id to xero_payments if missing
ALTER TABLE public.xero_payments ADD COLUMN IF NOT EXISTS xero_contact_id TEXT;
