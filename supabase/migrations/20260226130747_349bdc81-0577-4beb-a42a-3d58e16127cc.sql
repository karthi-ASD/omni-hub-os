
-- Create a security definer function to handle signup atomically
-- This bypasses RLS so the new user can create their business, update profile, and assign role
CREATE OR REPLACE FUNCTION public.handle_signup(
  _user_id UUID,
  _business_name TEXT,
  _email TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _business_id UUID;
BEGIN
  -- Create business
  INSERT INTO public.businesses (name)
  VALUES (_business_name)
  RETURNING id INTO _business_id;

  -- Update profile with business_id
  UPDATE public.profiles
  SET business_id = _business_id
  WHERE user_id = _user_id;

  -- Assign business_admin role
  INSERT INTO public.user_roles (user_id, role, business_id)
  VALUES (_user_id, 'business_admin', _business_id);

  -- Insert default settings
  INSERT INTO public.settings (business_id, key, value)
  VALUES
    (_business_id, 'timezone', 'Australia/Sydney'),
    (_business_id, 'currency', 'AUD'),
    (_business_id, 'date_format', 'DD/MM/YYYY'),
    (_business_id, 'theme', 'system');

  -- Log system event
  INSERT INTO public.system_events (business_id, event_type, payload_json)
  VALUES (_business_id, 'SIGNUP', jsonb_build_object('email', _email, 'business_name', _business_name));

  -- Audit log
  INSERT INTO public.audit_logs (business_id, actor_user_id, action_type, entity_type, entity_id, new_value_json)
  VALUES (_business_id, _user_id, 'CREATE_BUSINESS', 'business', _business_id::text, jsonb_build_object('name', _business_name));

  RETURN _business_id;
END;
$$;
