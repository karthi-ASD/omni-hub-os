
ALTER TABLE crm_communications ADD COLUMN IF NOT EXISTS followup_required boolean DEFAULT false;
ALTER TABLE crm_communications ADD COLUMN IF NOT EXISTS followup_action_type text;
ALTER TABLE crm_communications ADD COLUMN IF NOT EXISTS followup_date date;
ALTER TABLE crm_communications ADD COLUMN IF NOT EXISTS followup_time text;
ALTER TABLE crm_communications ADD COLUMN IF NOT EXISTS followup_notes text;
ALTER TABLE crm_communications ADD COLUMN IF NOT EXISTS followup_assigned_to text;
ALTER TABLE crm_communications ADD COLUMN IF NOT EXISTS auto_task_id uuid;

ALTER TABLE crm_tasks ADD COLUMN IF NOT EXISTS linked_communication_id uuid REFERENCES crm_communications(id);
ALTER TABLE crm_tasks ADD COLUMN IF NOT EXISTS customer_response text;
ALTER TABLE crm_tasks ADD COLUMN IF NOT EXISTS original_due_date date;
ALTER TABLE crm_tasks ADD COLUMN IF NOT EXISTS rescheduled_by text;
ALTER TABLE crm_tasks ADD COLUMN IF NOT EXISTS followup_time text;

CREATE TABLE IF NOT EXISTS crm_followup_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  enable_customer_email boolean DEFAULT true,
  enable_mobile_push boolean DEFAULT true,
  enable_mobile_confirmation boolean DEFAULT true,
  enable_employee_reminders boolean DEFAULT true,
  reminder_hours_before integer DEFAULT 2,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(business_id)
);

ALTER TABLE crm_followup_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business users can manage followup settings"
ON crm_followup_settings FOR ALL TO authenticated
USING (business_id IN (SELECT business_id FROM profiles WHERE user_id = auth.uid()))
WITH CHECK (business_id IN (SELECT business_id FROM profiles WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS crm_followup_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES crm_tasks(id) ON DELETE CASCADE,
  investor_id uuid REFERENCES crm_investors(id),
  response_type text NOT NULL DEFAULT 'pending',
  new_date date,
  customer_note text,
  responded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE crm_followup_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business users can manage followup responses"
ON crm_followup_responses FOR ALL TO authenticated
USING (business_id IN (SELECT business_id FROM profiles WHERE user_id = auth.uid()))
WITH CHECK (business_id IN (SELECT business_id FROM profiles WHERE user_id = auth.uid()));
