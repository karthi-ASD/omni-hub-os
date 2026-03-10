
-- Create client_services table for service subscriptions
CREATE TABLE public.client_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  service_type TEXT NOT NULL,
  service_subtype TEXT,
  service_details_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_services ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view client services in their business"
  ON public.client_services FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Users can insert client services in their business"
  ON public.client_services FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Users can update client services in their business"
  ON public.client_services FOR UPDATE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Users can delete client services in their business"
  ON public.client_services FOR DELETE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

-- Index for fast lookups
CREATE INDEX idx_client_services_client_id ON public.client_services(client_id);
CREATE INDEX idx_client_services_business_id ON public.client_services(business_id);
