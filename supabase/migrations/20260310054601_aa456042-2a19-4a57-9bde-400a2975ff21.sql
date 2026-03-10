
-- Add slug column without unique constraint first
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS slug text;

-- Backfill with unique slugs using row_number for duplicates
WITH slugs AS (
  SELECT id, 
    lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g')) as base_slug,
    row_number() OVER (PARTITION BY lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g')) ORDER BY created_at) as rn
  FROM public.businesses WHERE slug IS NULL
)
UPDATE public.businesses b
SET slug = CASE WHEN s.rn = 1 THEN s.base_slug ELSE s.base_slug || '-' || s.rn END
FROM slugs s WHERE b.id = s.id;

-- Now add unique constraint
ALTER TABLE public.businesses ADD CONSTRAINT businesses_slug_key UNIQUE (slug);

-- Create index for fast slug lookups
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON public.businesses(slug);

-- Function to generate slug from name
CREATE OR REPLACE FUNCTION public.generate_business_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter int := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := lower(regexp_replace(regexp_replace(NEW.name, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g'));
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    base_slug := trim(both '-' from base_slug);
    IF base_slug = '' THEN base_slug := 'company'; END IF;
    final_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM public.businesses WHERE slug = final_slug AND id != NEW.id) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    NEW.slug := final_slug;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_generate_business_slug ON public.businesses;
CREATE TRIGGER trg_generate_business_slug
BEFORE INSERT OR UPDATE ON public.businesses
FOR EACH ROW
EXECUTE FUNCTION public.generate_business_slug();

-- Create a function for company signup (joins existing business by slug)
CREATE OR REPLACE FUNCTION public.handle_company_signup(_user_id uuid, _business_slug text, _email text, _full_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _business_id UUID;
BEGIN
  SELECT id INTO _business_id FROM public.businesses WHERE slug = _business_slug AND status = 'active';
  IF _business_id IS NULL THEN
    RAISE EXCEPTION 'Company not found or inactive';
  END IF;

  UPDATE public.profiles
  SET business_id = _business_id, full_name = _full_name
  WHERE user_id = _user_id;

  INSERT INTO public.user_roles (user_id, role, business_id)
  VALUES (_user_id, 'employee', _business_id)
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.system_events (business_id, event_type, payload_json)
  VALUES (_business_id, 'COMPANY_SIGNUP', jsonb_build_object('email', _email, 'full_name', _full_name, 'slug', _business_slug));

  RETURN _business_id;
END;
$$;
