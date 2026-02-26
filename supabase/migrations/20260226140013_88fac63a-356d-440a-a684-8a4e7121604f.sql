
-- Stage 5: Proposals, Contracts, E-Sign, Clients, Projects

-- Proposal status enum
CREATE TYPE public.proposal_status AS ENUM ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired');

-- Contract status enum
CREATE TYPE public.contract_status AS ENUM ('draft', 'sent', 'signed', 'rejected');

-- Onboarding status enum
CREATE TYPE public.onboarding_status AS ENUM ('pending', 'in_progress', 'completed');

-- Project status enum
CREATE TYPE public.project_status AS ENUM ('new', 'in_progress', 'on_hold', 'completed');

-- Payment status enum
CREATE TYPE public.payment_status AS ENUM ('unpaid', 'paid');

-- =====================================================
-- PROPOSALS TABLE
-- =====================================================
CREATE TABLE public.proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  deal_id UUID NOT NULL REFERENCES public.deals(id),
  proposal_number SERIAL,
  title TEXT NOT NULL,
  description TEXT,
  services_json JSONB DEFAULT '[]'::jsonb,
  pricing_breakdown_json JSONB DEFAULT '[]'::jsonb,
  total_amount NUMERIC DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'AUD',
  tax_amount NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  status public.proposal_status NOT NULL DEFAULT 'draft',
  valid_until DATE,
  payment_required BOOLEAN NOT NULL DEFAULT false,
  payment_status public.payment_status NOT NULL DEFAULT 'unpaid',
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER proposals_updated_at BEFORE UPDATE ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business users can manage tenant proposals" ON public.proposals FOR ALL
  USING (business_id = get_user_business_id(auth.uid()));
CREATE POLICY "Super admins can manage all proposals" ON public.proposals FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

-- =====================================================
-- PROPOSAL VIEWS TABLE
-- =====================================================
CREATE TABLE public.proposal_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  viewer_ip TEXT,
  user_agent TEXT
);

ALTER TABLE public.proposal_views ENABLE ROW LEVEL SECURITY;

-- Public can insert views (from public link), business users can read
CREATE POLICY "Anyone can insert proposal views" ON public.proposal_views FOR INSERT
  WITH CHECK (true);
CREATE POLICY "Business users can view proposal views" ON public.proposal_views FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.proposals p WHERE p.id = proposal_id AND p.business_id = get_user_business_id(auth.uid())
  ));
CREATE POLICY "Super admins can view all proposal views" ON public.proposal_views FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'));

-- =====================================================
-- CONTRACTS TABLE
-- =====================================================
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  proposal_id UUID REFERENCES public.proposals(id),
  deal_id UUID NOT NULL REFERENCES public.deals(id),
  contract_number SERIAL,
  contract_content TEXT,
  status public.contract_status NOT NULL DEFAULT 'draft',
  signed_at TIMESTAMPTZ,
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER contracts_updated_at BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business users can manage tenant contracts" ON public.contracts FOR ALL
  USING (business_id = get_user_business_id(auth.uid()));
CREATE POLICY "Super admins can manage all contracts" ON public.contracts FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

-- =====================================================
-- SIGNATURES TABLE
-- =====================================================
CREATE TABLE public.signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  signer_name TEXT NOT NULL,
  signer_email TEXT NOT NULL,
  signature_data TEXT,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  sign_token UUID NOT NULL DEFAULT gen_random_uuid()
);

ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;

-- Public signing via token
CREATE POLICY "Anyone can insert signatures" ON public.signatures FOR INSERT
  WITH CHECK (true);
CREATE POLICY "Business users can view signatures" ON public.signatures FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.contracts c WHERE c.id = contract_id AND c.business_id = get_user_business_id(auth.uid())
  ));
CREATE POLICY "Super admins can view all signatures" ON public.signatures FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'));

-- =====================================================
-- CLIENTS TABLE
-- =====================================================
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  deal_id UUID REFERENCES public.deals(id),
  company_name TEXT,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  onboarding_status public.onboarding_status NOT NULL DEFAULT 'pending',
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER clients_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business users can manage tenant clients" ON public.clients FOR ALL
  USING (business_id = get_user_business_id(auth.uid()));
CREATE POLICY "Super admins can manage all clients" ON public.clients FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Clients can view own record" ON public.clients FOR SELECT
  USING (user_id = auth.uid());

-- =====================================================
-- PROJECTS TABLE
-- =====================================================
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  client_id UUID REFERENCES public.clients(id),
  deal_id UUID REFERENCES public.deals(id),
  project_name TEXT NOT NULL,
  description TEXT,
  assigned_manager_user_id UUID,
  status public.project_status NOT NULL DEFAULT 'new',
  start_date DATE,
  target_end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business users can manage tenant projects" ON public.projects FOR ALL
  USING (business_id = get_user_business_id(auth.uid()));
CREATE POLICY "Super admins can manage all projects" ON public.projects FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Clients can view own projects" ON public.projects FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.user_id = auth.uid()
  ));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.proposals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contracts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;

-- Indexes
CREATE INDEX idx_proposals_business_id ON public.proposals(business_id);
CREATE INDEX idx_proposals_deal_id ON public.proposals(deal_id);
CREATE INDEX idx_proposals_status ON public.proposals(status);
CREATE INDEX idx_contracts_business_id ON public.contracts(business_id);
CREATE INDEX idx_contracts_deal_id ON public.contracts(deal_id);
CREATE INDEX idx_contracts_status ON public.contracts(status);
CREATE INDEX idx_clients_business_id ON public.clients(business_id);
CREATE INDEX idx_projects_business_id ON public.projects(business_id);
CREATE INDEX idx_projects_client_id ON public.projects(client_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_signatures_contract_id ON public.signatures(contract_id);
CREATE INDEX idx_signatures_sign_token ON public.signatures(sign_token);
