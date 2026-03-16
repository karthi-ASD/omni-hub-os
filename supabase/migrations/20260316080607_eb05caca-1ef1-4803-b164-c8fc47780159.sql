CREATE POLICY "Employees can create leads for their business"
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'employee'::app_role)
  AND business_id = get_user_business_id(auth.uid())
);