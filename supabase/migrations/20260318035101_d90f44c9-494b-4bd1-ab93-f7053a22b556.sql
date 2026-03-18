
-- 1. Add is_active (soft delete) and paid_amount (partial payments) to installments
ALTER TABLE public.package_installments 
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS paid_amount numeric NOT NULL DEFAULT 0;

-- 2. Add created_by to payment_logs
ALTER TABLE public.package_payment_logs
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS log_type text NOT NULL DEFAULT 'payment';

-- 3. Update RPC to handle overdue + missed + partial logic (single source of truth)
CREATE OR REPLACE FUNCTION public.sync_overdue_installments(_package_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Mark pending past-due as overdue + missed
  UPDATE public.package_installments
  SET status = 'overdue', is_missed = true
  WHERE package_id = _package_id
    AND status = 'pending'
    AND due_date < CURRENT_DATE
    AND is_active = true;

  -- Mark partial payments where paid_amount > 0 but < amount
  UPDATE public.package_installments
  SET status = 'partial'
  WHERE package_id = _package_id
    AND paid_amount > 0
    AND paid_amount < amount
    AND status NOT IN ('paid', 'skipped')
    AND is_active = true;
END;
$$;
