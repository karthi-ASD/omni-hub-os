-- Task conversations (internal vs customer-visible)
CREATE TABLE public.task_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  task_id UUID NOT NULL,
  sender_user_id UUID NOT NULL,
  sender_name TEXT,
  message TEXT NOT NULL,
  conversation_type TEXT NOT NULL DEFAULT 'internal',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.task_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view conversations in their business" ON public.task_conversations FOR SELECT TO authenticated USING (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Users can insert conversations in their business" ON public.task_conversations FOR INSERT TO authenticated WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

-- Cross-department requests
CREATE TABLE public.cross_department_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  from_department_id UUID,
  to_department_id UUID,
  source_task_id UUID,
  request_title TEXT NOT NULL,
  request_message TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  requested_by_user_id UUID,
  requested_by_name TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.cross_department_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view requests in their business" ON public.cross_department_requests FOR SELECT TO authenticated USING (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Users can create requests in their business" ON public.cross_department_requests FOR INSERT TO authenticated WITH CHECK (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Users can update requests in their business" ON public.cross_department_requests FOR UPDATE TO authenticated USING (business_id = public.get_user_business_id(auth.uid()));

-- Task dependencies
CREATE TABLE public.task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  task_id UUID NOT NULL,
  depends_on_task_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(task_id, depends_on_task_id)
);

ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage dependencies in their business" ON public.task_dependencies FOR ALL TO authenticated USING (business_id = public.get_user_business_id(auth.uid()));

-- Add task_number to project_tasks
ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS task_number TEXT;

-- Function to auto-generate task numbers
CREATE OR REPLACE FUNCTION public.generate_task_number()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE
  seq_num INT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(task_number FROM 'NW-TASK-(\d+)') AS INT)), 0) + 1
  INTO seq_num
  FROM public.project_tasks
  WHERE business_id = NEW.business_id;
  NEW.task_number := 'NW-TASK-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_generate_task_number ON public.project_tasks;
CREATE TRIGGER trg_generate_task_number
  BEFORE INSERT ON public.project_tasks
  FOR EACH ROW EXECUTE FUNCTION public.generate_task_number();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cross_department_requests;