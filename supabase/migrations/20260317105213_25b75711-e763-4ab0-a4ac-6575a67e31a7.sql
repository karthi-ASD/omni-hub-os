
-- Fix SECURITY DEFINER view by using SECURITY INVOKER explicitly
DROP VIEW IF EXISTS public.client_integrity_report;

CREATE VIEW public.client_integrity_report
WITH (security_invoker = true)
AS
SELECT
  c.id,
  c.business_id,
  c.contact_name,
  c.email,
  c.phone,
  c.xero_contact_id,
  c.client_status,
  (SELECT count(*) FROM public.clients c2
   WHERE lower(c2.email) = lower(c.email)
     AND c2.business_id = c.business_id
     AND c2.id != c.id
     AND c2.deleted_at IS NULL AND c2.merged_into IS NULL) AS duplicate_email_count,
  (SELECT count(*) FROM public.clients c2
   WHERE c2.phone IS NOT NULL AND c.phone IS NOT NULL
     AND regexp_replace(c2.phone, '[^0-9]', '', 'g') = regexp_replace(c.phone, '[^0-9]', '', 'g')
     AND c2.business_id = c.business_id
     AND c2.id != c.id
     AND c2.deleted_at IS NULL AND c2.merged_into IS NULL) AS duplicate_phone_count,
  (SELECT count(*) FROM public.support_tickets t WHERE t.client_id = c.id) AS ticket_count,
  (SELECT count(*) FROM public.seo_projects s WHERE s.client_id = c.id) AS seo_project_count,
  (SELECT count(*) FROM public.xero_invoices x WHERE x.client_id = c.id) AS invoice_count,
  (SELECT count(*) FROM public.projects p WHERE p.client_id = c.id) AS project_count
FROM public.clients c
WHERE c.deleted_at IS NULL AND c.merged_into IS NULL;
