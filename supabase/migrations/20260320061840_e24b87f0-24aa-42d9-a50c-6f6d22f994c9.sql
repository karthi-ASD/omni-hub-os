ALTER TABLE public.nextweb_service_requests
  ADD COLUMN IF NOT EXISTS service_category TEXT DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS sla_status TEXT DEFAULT 'on_time',
  ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE INDEX IF NOT EXISTS idx_nextweb_requests_category ON public.nextweb_service_requests(service_category);
CREATE INDEX IF NOT EXISTS idx_nextweb_requests_sla ON public.nextweb_service_requests(sla_status);