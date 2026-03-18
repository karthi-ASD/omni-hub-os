
-- Add end_date to client_packages
ALTER TABLE public.client_packages ADD COLUMN IF NOT EXISTS end_date date;

-- Add is_missed to package_installments
ALTER TABLE public.package_installments ADD COLUMN IF NOT EXISTS is_missed boolean NOT NULL DEFAULT false;

-- Create package_payment_logs table
CREATE TABLE IF NOT EXISTS public.package_payment_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  installment_id uuid REFERENCES public.package_installments(id) ON DELETE CASCADE NOT NULL,
  package_id uuid REFERENCES public.client_packages(id) ON DELETE CASCADE NOT NULL,
  business_id uuid REFERENCES public.businesses(id) NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  paid_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text DEFAULT 'bank_transfer',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.package_payment_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view payment logs in their business"
  ON public.package_payment_logs FOR SELECT TO authenticated
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert payment logs in their business"
  ON public.package_payment_logs FOR INSERT TO authenticated
  WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- Function to auto-sync overdue and missed statuses
CREATE OR REPLACE FUNCTION public.sync_overdue_installments(_package_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.package_installments
  SET status = 'overdue', is_missed = true
  WHERE package_id = _package_id
    AND status = 'pending'
    AND due_date < CURRENT_DATE;
END;
$$;
