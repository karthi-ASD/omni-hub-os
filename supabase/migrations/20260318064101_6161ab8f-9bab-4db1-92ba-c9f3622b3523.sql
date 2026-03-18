CREATE OR REPLACE FUNCTION public.get_provider_business_id_for_client_user(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.business_id
  FROM public.client_users cu
  JOIN public.clients c ON c.id = cu.client_id
  WHERE cu.user_id = _user_id
    AND cu.is_primary = true
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.can_insert_client_ticket(_business_id uuid, _client_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.client_users cu
    JOIN public.clients c ON c.id = cu.client_id
    WHERE cu.user_id = _user_id
      AND cu.is_primary = true
      AND cu.client_id = _client_id
      AND c.business_id = _business_id
  )
$$;

CREATE OR REPLACE FUNCTION public.can_access_ticket_as_client(_ticket_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.support_tickets st
    WHERE st.id = _ticket_id
      AND st.client_id = public.get_client_id_for_user(_user_id)
  )
$$;

CREATE OR REPLACE FUNCTION public.can_insert_ticket_audit_as_client(_ticket_id uuid, _business_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.support_tickets st
    WHERE st.id = _ticket_id
      AND st.business_id = _business_id
      AND st.client_id = public.get_client_id_for_user(_user_id)
  )
$$;

DROP POLICY IF EXISTS "Users can create tickets in their business" ON public.support_tickets;
CREATE POLICY "Users can create tickets in their business"
ON public.support_tickets
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin'::app_role)
  OR business_id = public.get_user_business_id(auth.uid())
  OR public.can_insert_client_ticket(business_id, client_id, auth.uid())
);

DROP POLICY IF EXISTS "Users can view ticket messages for their business" ON public.ticket_messages;
CREATE POLICY "Users can view ticket messages for their business"
ON public.ticket_messages
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin'::app_role)
  OR business_id IN (
    SELECT profiles.business_id
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
  )
  OR (
    COALESCE(is_internal, false) = false
    AND public.can_access_ticket_as_client(ticket_id, auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can insert ticket messages for their business" ON public.ticket_messages;
CREATE POLICY "Users can insert ticket messages for their business"
ON public.ticket_messages
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin'::app_role)
  OR business_id IN (
    SELECT profiles.business_id
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
  )
  OR (
    COALESCE(is_internal, false) = false
    AND sender_user_id = auth.uid()
    AND sender_type IN ('customer', 'client')
    AND public.can_access_ticket_as_client(ticket_id, auth.uid())
    AND business_id = public.get_provider_business_id_for_client_user(auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can insert ticket audit logs for their business" ON public.ticket_audit_log;
CREATE POLICY "Users can insert ticket audit logs for their business"
ON public.ticket_audit_log
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin'::app_role)
  OR business_id IN (
    SELECT profiles.business_id
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
  )
  OR public.can_insert_ticket_audit_as_client(ticket_id, business_id, auth.uid())
);