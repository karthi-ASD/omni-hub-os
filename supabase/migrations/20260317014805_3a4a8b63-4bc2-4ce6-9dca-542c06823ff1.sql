
-- Add soft delete and merge columns to clients table
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS deleted_by UUID DEFAULT NULL;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS merged_into UUID DEFAULT NULL REFERENCES public.clients(id);
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS merged_at TIMESTAMPTZ DEFAULT NULL;
