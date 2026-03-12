
-- Add source/target department distinction and new status options to internal_tickets
ALTER TABLE public.internal_tickets 
  ADD COLUMN IF NOT EXISTS assigned_to_department text,
  ADD COLUMN IF NOT EXISTS source_department text,
  ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'internal';

-- Migrate existing data: current 'department' field was the target department
UPDATE public.internal_tickets 
SET assigned_to_department = department
WHERE assigned_to_department IS NULL;

-- Add activity log table for ticket history
CREATE TABLE IF NOT EXISTS public.internal_ticket_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES public.internal_tickets(id) ON DELETE CASCADE NOT NULL,
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  user_id uuid,
  user_name text,
  action_type text NOT NULL,
  old_value text,
  new_value text,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.internal_ticket_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activity for their business"
  ON public.internal_ticket_activity FOR SELECT
  TO authenticated
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert activity for their business"
  ON public.internal_ticket_activity FOR INSERT
  TO authenticated
  WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE user_id = auth.uid()));

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_internal_tickets_assigned_dept ON public.internal_tickets(assigned_to_department);
CREATE INDEX IF NOT EXISTS idx_internal_tickets_source_dept ON public.internal_tickets(source_department);
CREATE INDEX IF NOT EXISTS idx_internal_ticket_activity_ticket ON public.internal_ticket_activity(ticket_id);
