
-- 1. Create client_user_role enum
CREATE TYPE public.client_user_role AS ENUM ('owner', 'marketing_manager', 'viewer');

-- 2. Create client_users linking table
CREATE TABLE public.client_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  role client_user_role NOT NULL DEFAULT 'owner',
  is_primary boolean NOT NULL DEFAULT false,
  invited_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, client_id)
);

-- 3. Add login_status and activation fields to clients
ALTER TABLE public.clients 
  ADD COLUMN IF NOT EXISTS login_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS activation_token uuid,
  ADD COLUMN IF NOT EXISTS activation_token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS auth_user_id uuid;

-- 4. Enable RLS on client_users
ALTER TABLE public.client_users ENABLE ROW LEVEL SECURITY;

-- 5. RLS policies
CREATE POLICY "Users can view own client_users" ON public.client_users
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Business admins can manage client_users" ON public.client_users
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      JOIN public.profiles p ON p.business_id = c.business_id
      WHERE c.id = client_users.client_id
        AND p.user_id = auth.uid()
        AND (
          public.has_role(auth.uid(), 'super_admin') OR
          public.has_role(auth.uid(), 'business_admin')
        )
    )
  );

-- 6. Insert system_mode setting
INSERT INTO public.settings (business_id, key, value)
SELECT b.id, 'system_mode', 'testing'
FROM public.businesses b
WHERE NOT EXISTS (
  SELECT 1 FROM public.settings s WHERE s.business_id = b.id AND s.key = 'system_mode'
);

-- 7. Trigger to auto-link client_users when auth_user_id is set
CREATE OR REPLACE FUNCTION public.auto_link_client_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.auth_user_id IS NOT NULL AND (OLD.auth_user_id IS NULL OR OLD.auth_user_id IS DISTINCT FROM NEW.auth_user_id) THEN
    INSERT INTO public.client_users (user_id, client_id, role, is_primary)
    VALUES (NEW.auth_user_id, NEW.id, 'owner', true)
    ON CONFLICT (user_id, client_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_link_client_user
  AFTER UPDATE OF auth_user_id ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.auto_link_client_user();

-- 8. Helper functions
CREATE OR REPLACE FUNCTION public.find_client_by_email(_email text, _business_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id FROM public.clients
  WHERE email = _email AND business_id = _business_id
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_system_mode(_business_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT value FROM public.settings WHERE business_id = _business_id AND key = 'system_mode'),
    'testing'
  );
$$;
