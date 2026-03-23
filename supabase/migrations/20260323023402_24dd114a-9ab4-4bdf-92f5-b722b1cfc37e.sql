CREATE OR REPLACE FUNCTION public.find_entity_by_phone(_business_id UUID, _phone TEXT)
RETURNS JSON
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  norm TEXT;
  suffix TEXT;
  result JSON;
BEGIN
  norm := regexp_replace(COALESCE(_phone, ''), '[^0-9+]', '', 'g');
  IF length(norm) < 6 THEN
    RETURN '[]'::json;
  END IF;
  suffix := right(regexp_replace(norm, '[^0-9]', '', 'g'), 9);

  SELECT COALESCE(json_agg(row_to_json(m)), '[]'::json)
  INTO result
  FROM (
    (SELECT 'lead' AS entity_type, id AS entity_id, id AS lead_id, NULL::uuid AS contact_id, NULL::uuid AS client_id, NULL::uuid AS account_id,
           name AS matched_name, company AS matched_business_name
    FROM public.leads
    WHERE business_id = _business_id
      AND regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g') LIKE '%' || suffix
    LIMIT 3)
    UNION ALL
    (SELECT 'contact', id, NULL, id, NULL, NULL,
           COALESCE(first_name || ' ' || last_name, first_name, last_name, email), company
    FROM public.contacts
    WHERE business_id = _business_id
      AND (
        regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g') LIKE '%' || suffix
        OR regexp_replace(COALESCE(alternate_phone, ''), '[^0-9]', '', 'g') LIKE '%' || suffix
      )
    LIMIT 3)
    UNION ALL
    (SELECT 'client', id, NULL, NULL, id, NULL,
           contact_name, company_name
    FROM public.clients
    WHERE business_id = _business_id
      AND (
        regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g') LIKE '%' || suffix
        OR COALESCE(phone_normalized, '') LIKE '%' || suffix
      )
    LIMIT 3)
    UNION ALL
    (SELECT 'account', id, NULL, NULL, NULL, id,
           company_name, company_name
    FROM public.accounts
    WHERE business_id = _business_id
      AND regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g') LIKE '%' || suffix
    LIMIT 3)
  ) m;

  RETURN result;
END;
$function$