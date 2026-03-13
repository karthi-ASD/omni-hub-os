
-- Add new columns to clients table for department access
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS assigned_seo_manager_id uuid;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS renewal_date date;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS contract_value numeric DEFAULT 0;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'current';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS last_payment_date date;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS service_category text;

-- Create renewal_reminders table
CREATE TABLE public.renewal_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  contract_id uuid,
  reminder_type text NOT NULL DEFAULT '30_day',
  reminder_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  assigned_sales_rep_id uuid,
  assigned_accounts_user_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.renewal_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view renewal reminders for their business"
ON public.renewal_reminders FOR SELECT TO authenticated
USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert renewal reminders for their business"
ON public.renewal_reminders FOR INSERT TO authenticated
WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update renewal reminders for their business"
ON public.renewal_reminders FOR UPDATE TO authenticated
USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Super admins can do anything with renewal reminders"
ON public.renewal_reminders FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));
