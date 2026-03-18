-- Package onboarding status table
CREATE TABLE public.package_onboarding_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.client_packages(id) ON DELETE CASCADE,
  step_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  sort_order int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.package_onboarding_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage onboarding status"
  ON public.package_onboarding_status
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.client_packages cp
      JOIN public.profiles p ON p.business_id = cp.business_id
      WHERE cp.id = package_onboarding_status.package_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.client_packages cp
      JOIN public.profiles p ON p.business_id = cp.business_id
      WHERE cp.id = package_onboarding_status.package_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can view own onboarding status"
  ON public.package_onboarding_status
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.client_packages cp
      JOIN public.client_users cu ON cu.client_id = cp.client_id
      WHERE cp.id = package_onboarding_status.package_id
        AND cu.user_id = auth.uid()
    )
  );

-- Auto-create default onboarding steps when a package is created
CREATE OR REPLACE FUNCTION public.auto_create_package_onboarding()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.package_onboarding_status (package_id, step_name, status, sort_order) VALUES
    (NEW.id, 'Website Setup',           'pending', 1),
    (NEW.id, 'SEO Setup',              'pending', 2),
    (NEW.id, 'Analytics Integration',   'pending', 3),
    (NEW.id, 'Ads Setup',              'pending', 4),
    (NEW.id, 'Reporting Setup',         'pending', 5);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_create_package_onboarding
  AFTER INSERT ON public.client_packages
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_package_onboarding();