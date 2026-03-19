
-- Investor enhancements: readiness score & objection tracking
ALTER TABLE crm_investors ADD COLUMN IF NOT EXISTS readiness_score integer DEFAULT 0;
ALTER TABLE crm_investors ADD COLUMN IF NOT EXISTS readiness_label text DEFAULT 'low';
ALTER TABLE crm_investors ADD COLUMN IF NOT EXISTS last_contact_date timestamptz;
ALTER TABLE crm_investors ADD COLUMN IF NOT EXISTS objection_type text;
ALTER TABLE crm_investors ADD COLUMN IF NOT EXISTS objection_notes text;

-- Lead enhancements: objection tracking
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS objection_type text;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS objection_notes text;

-- Deal enhancements: transparency tracker fields
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS finance_status text DEFAULT 'pending';
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS responsible_broker text;
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS responsible_lawyer text;
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS responsible_accountant text;
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS delay_reason text;
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS pending_actions text;

-- Opportunity enhancements: urgency signals
ALTER TABLE crm_properties ADD COLUMN IF NOT EXISTS urgency_tag text;
ALTER TABLE crm_properties ADD COLUMN IF NOT EXISTS urgency_deadline date;
ALTER TABLE crm_properties ADD COLUMN IF NOT EXISTS demand_level text DEFAULT 'normal';

-- Auto check-in settings
ALTER TABLE crm_followup_settings ADD COLUMN IF NOT EXISTS enable_auto_checkin boolean DEFAULT true;
ALTER TABLE crm_followup_settings ADD COLUMN IF NOT EXISTS checkin_after_days integer DEFAULT 7;
ALTER TABLE crm_followup_settings ADD COLUMN IF NOT EXISTS reengage_after_days integer DEFAULT 30;
ALTER TABLE crm_followup_settings ADD COLUMN IF NOT EXISTS enable_call_summary_email boolean DEFAULT true;
