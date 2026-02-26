
-- Create a trigger function that auto-assigns super_admin to karthi@nextweb.com.au on signup
CREATE OR REPLACE FUNCTION public.assign_super_admin_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.email = 'karthi@nextweb.com.au' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger to profiles table (fires after handle_new_user creates the profile)
DROP TRIGGER IF EXISTS trg_assign_super_admin ON public.profiles;
CREATE TRIGGER trg_assign_super_admin
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_super_admin_on_signup();
