
-- Add hr_manager to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'hr_manager';

-- Auto-assign hr_manager role to hr@nextweb.co.in on profile creation
CREATE OR REPLACE FUNCTION public.assign_hr_manager_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.email = 'hr@nextweb.co.in' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'hr_manager')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger on profiles insert
CREATE TRIGGER trg_assign_hr_manager
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.assign_hr_manager_on_signup();
