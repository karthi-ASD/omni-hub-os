
-- 1. Onboarding checklist items table
CREATE TABLE public.onboarding_checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  item_title TEXT NOT NULL,
  item_category TEXT NOT NULL DEFAULT 'general',
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  notes TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarding_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business onboarding items" ON public.onboarding_checklist_items
  FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Users can insert own business onboarding items" ON public.onboarding_checklist_items
  FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Users can update own business onboarding items" ON public.onboarding_checklist_items
  FOR UPDATE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Users can delete own business onboarding items" ON public.onboarding_checklist_items
  FOR DELETE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

-- 2. Website project stages table
CREATE TABLE public.website_project_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  website_id UUID REFERENCES public.client_websites(id) ON DELETE SET NULL,
  project_name TEXT NOT NULL,
  current_stage TEXT NOT NULL DEFAULT 'requirement_gathering',
  stage_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  assigned_team_lead UUID,
  start_date DATE,
  target_launch_date DATE,
  actual_launch_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.website_project_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business website stages" ON public.website_project_stages
  FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Users can insert own business website stages" ON public.website_project_stages
  FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Users can update own business website stages" ON public.website_project_stages
  FOR UPDATE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Users can delete own business website stages" ON public.website_project_stages
  FOR DELETE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

-- 3. Content tasks table
CREATE TABLE public.content_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  content_type TEXT NOT NULL DEFAULT 'blog',
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date DATE,
  word_count INT,
  target_keyword TEXT,
  published_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.content_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business content tasks" ON public.content_tasks
  FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Users can insert own business content tasks" ON public.content_tasks
  FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Users can update own business content tasks" ON public.content_tasks
  FOR UPDATE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Users can delete own business content tasks" ON public.content_tasks
  FOR DELETE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

-- 4. Trigger to auto-create onboarding checklist when deal is won
CREATE OR REPLACE FUNCTION public.auto_create_onboarding_checklist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _client_id UUID;
BEGIN
  IF NEW.stage = 'won' AND (OLD.stage IS DISTINCT FROM 'won') THEN
    SELECT id INTO _client_id FROM public.clients 
    WHERE deal_id = NEW.id AND business_id = NEW.business_id 
    LIMIT 1;

    IF _client_id IS NOT NULL THEN
      INSERT INTO public.onboarding_checklist_items (business_id, client_id, deal_id, item_title, item_category, sort_order) VALUES
        (NEW.business_id, _client_id, NEW.id, 'Business verification & documents', 'verification', 1),
        (NEW.business_id, _client_id, NEW.id, 'Collect domain login details', 'access', 2),
        (NEW.business_id, _client_id, NEW.id, 'Collect hosting access credentials', 'access', 3),
        (NEW.business_id, _client_id, NEW.id, 'Collect CMS login credentials', 'access', 4),
        (NEW.business_id, _client_id, NEW.id, 'Setup Google Analytics access', 'analytics', 5),
        (NEW.business_id, _client_id, NEW.id, 'Setup Google Search Console access', 'analytics', 6),
        (NEW.business_id, _client_id, NEW.id, 'Setup Google Business Profile access', 'analytics', 7),
        (NEW.business_id, _client_id, NEW.id, 'Collect ad account credentials', 'ads', 8),
        (NEW.business_id, _client_id, NEW.id, 'Collect social media account access', 'social', 9),
        (NEW.business_id, _client_id, NEW.id, 'Collect brand assets (logo, colors, fonts)', 'brand', 10),
        (NEW.business_id, _client_id, NEW.id, 'Collect competitor list', 'strategy', 11),
        (NEW.business_id, _client_id, NEW.id, 'Collect target keywords list', 'strategy', 12),
        (NEW.business_id, _client_id, NEW.id, 'Collect target locations', 'strategy', 13),
        (NEW.business_id, _client_id, NEW.id, 'Welcome email sent to client', 'communication', 14),
        (NEW.business_id, _client_id, NEW.id, 'Kickoff meeting scheduled', 'communication', 15);

      INSERT INTO public.system_events (business_id, event_type, payload_json)
      VALUES (NEW.business_id, 'ONBOARDING_CHECKLIST_CREATED', jsonb_build_object(
        'client_id', _client_id, 'deal_id', NEW.id
      ));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_onboarding_checklist
  AFTER UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_onboarding_checklist();
