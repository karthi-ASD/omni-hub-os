
-- =============================================
-- 1. Client Website Pages (Sitemap Tree)
-- =============================================
CREATE TABLE public.client_website_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  url text NOT NULL,
  parent_url text,
  level integer NOT NULL DEFAULT 0,
  page_title text,
  status_code integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, url)
);

CREATE INDEX idx_client_website_pages_client ON public.client_website_pages(client_id);
CREATE INDEX idx_client_website_pages_business ON public.client_website_pages(business_id);

ALTER TABLE public.client_website_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view website pages for their business"
  ON public.client_website_pages FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Staff can manage website pages for their business"
  ON public.client_website_pages FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

-- Client can view their own pages
CREATE POLICY "Clients can view own website pages"
  ON public.client_website_pages FOR SELECT TO authenticated
  USING (
    public.is_client_user(auth.uid())
    AND client_id = public.get_client_id_for_user(auth.uid())
  );

-- =============================================
-- 2. Client Contacts (multiple emails/phones)
-- =============================================
CREATE TABLE public.client_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  contact_type text NOT NULL CHECK (contact_type IN ('email', 'phone', 'mobile')),
  label text DEFAULT 'primary',
  value text NOT NULL,
  is_primary boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_client_contacts_client ON public.client_contacts(client_id);
ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage client contacts"
  ON public.client_contacts FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Clients can view own contacts"
  ON public.client_contacts FOR SELECT TO authenticated
  USING (
    public.is_client_user(auth.uid())
    AND client_id = public.get_client_id_for_user(auth.uid())
  );

-- =============================================
-- 3. Client Social Links
-- =============================================
CREATE TABLE public.client_social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'youtube', 'twitter', 'tiktok', 'pinterest', 'other')),
  url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, platform)
);

CREATE INDEX idx_client_social_links_client ON public.client_social_links(client_id);
ALTER TABLE public.client_social_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage client social links"
  ON public.client_social_links FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Clients can view own social links"
  ON public.client_social_links FOR SELECT TO authenticated
  USING (
    public.is_client_user(auth.uid())
    AND client_id = public.get_client_id_for_user(auth.uid())
  );

-- =============================================
-- 4. Add google_map_link to clients if not exists
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'google_map_link') THEN
    ALTER TABLE public.clients ADD COLUMN google_map_link text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'contact_person_name') THEN
    ALTER TABLE public.clients ADD COLUMN contact_person_name text;
  END IF;
END $$;
