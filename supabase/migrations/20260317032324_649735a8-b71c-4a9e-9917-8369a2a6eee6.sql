-- Fix the clients view policy for client portal users
-- Drop the old policy that uses user_id (wrong column)
DROP POLICY IF EXISTS "Clients can view own record" ON public.clients;

-- Create a corrected policy that checks client_users link
CREATE POLICY "Client users can view own record"
ON public.clients FOR SELECT
TO authenticated
USING (
  id = public.get_client_id_for_user(auth.uid())
);

-- Add policy for client users to view their own invoices via client_id
DROP POLICY IF EXISTS "Clients can view own invoices" ON public.invoices;

CREATE POLICY "Client users can view own invoices"
ON public.invoices FOR SELECT
TO authenticated
USING (
  client_id = public.get_client_id_for_user(auth.uid())
);

-- SEO: clients can view own projects
DROP POLICY IF EXISTS "Clients view own SEO projects" ON public.seo_projects;

CREATE POLICY "Client users view own SEO projects"
ON public.seo_projects FOR SELECT
TO authenticated
USING (
  client_id = public.get_client_id_for_user(auth.uid())
);