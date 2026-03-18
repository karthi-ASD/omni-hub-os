-- Harden onboarding updates so only admins and SEO/digital marketing staff can modify package onboarding status

CREATE OR REPLACE FUNCTION public.can_edit_package_onboarding(_package_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.client_packages cp
    LEFT JOIN public.profiles p
      ON p.user_id = auth.uid()
     AND p.business_id = cp.business_id
    LEFT JOIN public.hr_employees he
      ON he.user_id = auth.uid()
     AND he.business_id = cp.business_id
    LEFT JOIN public.departments d
      ON d.id = he.department_id
    WHERE cp.id = _package_id
      AND (
        public.has_role(auth.uid(), 'super_admin')
        OR public.has_role(auth.uid(), 'business_admin')
        OR lower(coalesce(d.name, '')) LIKE '%seo%'
        OR lower(coalesce(d.name, '')) LIKE '%digital marketing%'
      )
  );
$$;

DROP POLICY IF EXISTS "Staff can manage onboarding status" ON public.package_onboarding_status;

CREATE POLICY "SEO and admins can manage onboarding status"
ON public.package_onboarding_status
FOR ALL
TO authenticated
USING (public.can_edit_package_onboarding(package_id))
WITH CHECK (public.can_edit_package_onboarding(package_id));