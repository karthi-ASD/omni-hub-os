-- Add custom data JSON to leads for tenant-specific fields (solar, etc.)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS custom_data_json jsonb DEFAULT '{}'::jsonb;

-- Add address field to leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS address text;

-- Add property_type for service businesses
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS property_type text;

-- Add priority level
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium';

-- Add lost_reason for mandatory capture when status = lost
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lost_reason text;

-- Add lead_id reference to proposals table for direct lead-to-proposal linking
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL;

-- Add client_name, client_email, client_phone to proposals for auto-fill
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS client_name text;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS client_email text;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS client_phone text;

-- Add sent tracking
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS sent_at timestamp with time zone;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS sent_via text;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS opened_at timestamp with time zone;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS approved_by_name text;

-- Add installation-specific fields for service proposals
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS installation_timeline text;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS system_size text;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS proposal_notes text;

-- Index for lead_id on proposals
CREATE INDEX IF NOT EXISTS idx_proposals_lead_id ON public.proposals(lead_id);

-- Index for custom_data_json GIN
CREATE INDEX IF NOT EXISTS idx_leads_custom_data ON public.leads USING GIN (custom_data_json);