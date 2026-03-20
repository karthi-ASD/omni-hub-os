-- Add crm_type to businesses table for dynamic CRM type resolution
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS crm_type text DEFAULT 'generic';

-- Backfill known businesses
UPDATE public.businesses SET crm_type = 'real_estate' WHERE id = 'fcd55dac-804b-462f-8a95-1d49cdd0b03d' AND crm_type = 'generic';
UPDATE public.businesses SET crm_type = 'service' WHERE id = '6b2ce9b9-006d-463f-a194-154a4a429b08' AND crm_type = 'generic';