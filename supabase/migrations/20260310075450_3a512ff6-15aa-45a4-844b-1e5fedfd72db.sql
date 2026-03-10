
-- Role module permissions table for granular RBAC
CREATE TABLE public.role_module_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  module_key TEXT NOT NULL,
  can_view BOOLEAN NOT NULL DEFAULT false,
  can_create BOOLEAN NOT NULL DEFAULT false,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  can_approve BOOLEAN NOT NULL DEFAULT false,
  can_export BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, role_name, module_key)
);

-- Enable RLS
ALTER TABLE public.role_module_permissions ENABLE ROW LEVEL SECURITY;

-- Super admins can do everything
CREATE POLICY "Super admins full access" ON public.role_module_permissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Business admins can manage their own business permissions
CREATE POLICY "Business admins manage own" ON public.role_module_permissions
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'business_admin') 
    AND business_id = public.get_user_business_id(auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'business_admin') 
    AND business_id = public.get_user_business_id(auth.uid())
  );

-- All authenticated users can read permissions for their business
CREATE POLICY "Users read own business permissions" ON public.role_module_permissions
  FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

-- Updated_at trigger
CREATE TRIGGER update_role_module_permissions_updated_at
  BEFORE UPDATE ON public.role_module_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
