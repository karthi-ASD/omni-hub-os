
CREATE TABLE public.website_trees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.seo_projects(id) ON DELETE SET NULL,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'client' CHECK (source_type IN ('client', 'competitor')),
  tree_data JSONB DEFAULT '[]'::jsonb,
  total_pages INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, project_id, domain)
);

ALTER TABLE public.website_trees ENABLE ROW LEVEL SECURITY;

-- SEO team / admin can manage trees for their business
CREATE POLICY "Staff can manage website trees" ON public.website_trees
FOR ALL TO authenticated
USING (
  business_id = public.get_user_business_id(auth.uid())
  AND NOT public.is_client_user(auth.uid())
)
WITH CHECK (
  business_id = public.get_user_business_id(auth.uid())
  AND NOT public.is_client_user(auth.uid())
);

-- Clients can only read their own trees
CREATE POLICY "Clients can view own website trees" ON public.website_trees
FOR SELECT TO authenticated
USING (
  client_id = public.get_client_id_for_user(auth.uid())
);

CREATE TRIGGER update_website_trees_updated_at
  BEFORE UPDATE ON public.website_trees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
