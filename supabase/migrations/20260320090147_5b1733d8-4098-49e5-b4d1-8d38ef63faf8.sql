
CREATE TABLE IF NOT EXISTS public.meta_page_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  page_id TEXT NOT NULL,
  page_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(page_id)
);

ALTER TABLE public.meta_page_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their business meta mappings"
  ON public.meta_page_mappings FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Admins can manage meta mappings"
  ON public.meta_page_mappings FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'business_admin')
  );
