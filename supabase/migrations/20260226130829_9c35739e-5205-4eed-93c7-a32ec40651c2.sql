
-- Auto-generate notifications via database triggers

-- Trigger function: notify on business status change
CREATE OR REPLACE FUNCTION public.notify_business_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- On business creation
  IF TG_OP = 'INSERT' THEN
    -- Notify all users in that business
    INSERT INTO public.notifications (business_id, user_id, type, title, message)
    SELECT NEW.id, p.user_id, 'system', 
      'Business created',
      'Welcome to ' || NEW.name || '! Your tenant has been set up.'
    FROM public.profiles p WHERE p.business_id = NEW.id;
    RETURN NEW;
  END IF;

  -- On status change (suspend/reactivate)
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.notifications (business_id, user_id, type, title, message)
    SELECT NEW.id, p.user_id, 
      CASE WHEN NEW.status = 'suspended' THEN 'warning' ELSE 'info' END::notification_type,
      CASE WHEN NEW.status = 'suspended' THEN 'Business suspended' ELSE 'Business reactivated' END,
      'Business "' || NEW.name || '" has been ' || NEW.status || '.'
    FROM public.profiles p WHERE p.business_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_business_status
  AFTER INSERT OR UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION notify_business_status_change();

-- Trigger function: notify on user creation (profile insert)
CREATE OR REPLACE FUNCTION public.notify_user_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notify the new user
  INSERT INTO public.notifications (business_id, user_id, type, title, message)
  VALUES (
    NEW.business_id,
    NEW.user_id,
    'info',
    'Welcome to NextWeb OS',
    'Your account has been created. Explore your dashboard!'
  );

  -- Notify business admins in the same tenant
  IF NEW.business_id IS NOT NULL THEN
    INSERT INTO public.notifications (business_id, user_id, type, title, message)
    SELECT NEW.business_id, ur.user_id, 'system',
      'New user joined',
      NEW.full_name || ' (' || NEW.email || ') has joined your team.'
    FROM public.user_roles ur
    WHERE ur.business_id = NEW.business_id
      AND ur.role = 'business_admin'
      AND ur.user_id != NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_user_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION notify_user_created();
