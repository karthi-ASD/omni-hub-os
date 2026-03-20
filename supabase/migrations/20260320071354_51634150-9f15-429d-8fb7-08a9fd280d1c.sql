-- 1. Unique constraint: one project per proposal per business
CREATE UNIQUE INDEX IF NOT EXISTS unique_project_per_proposal
ON public.projects (business_id, proposal_id)
WHERE proposal_id IS NOT NULL;

-- 2. Add phone_normalized column to clients for fast exact matching
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS phone_normalized text;

-- 3. Create index on phone_normalized for fast lookups
CREATE INDEX IF NOT EXISTS idx_clients_phone_normalized
ON public.clients (business_id, phone_normalized)
WHERE phone_normalized IS NOT NULL;

-- 4. Backfill phone_normalized from existing phone/mobile data
UPDATE public.clients
SET phone_normalized = regexp_replace(COALESCE(phone, mobile, ''), '[^0-9]', '', 'g')
WHERE phone_normalized IS NULL
  AND (phone IS NOT NULL OR mobile IS NOT NULL);

-- 5. Create trigger to auto-populate phone_normalized on insert/update
CREATE OR REPLACE FUNCTION public.normalize_client_phone()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.phone_normalized := regexp_replace(COALESCE(NEW.phone, NEW.mobile, ''), '[^0-9]', '', 'g');
  IF NEW.phone_normalized = '' THEN
    NEW.phone_normalized := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_normalize_client_phone ON public.clients;
CREATE TRIGGER trg_normalize_client_phone
BEFORE INSERT OR UPDATE OF phone, mobile ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.normalize_client_phone();