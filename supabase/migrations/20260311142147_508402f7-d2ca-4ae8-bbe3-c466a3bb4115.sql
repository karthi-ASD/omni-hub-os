
-- Google reviews tracked per business
CREATE TABLE public.google_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  review_id TEXT,
  reviewer_name TEXT,
  reviewer_photo_url TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  review_time TIMESTAMPTZ,
  reply_text TEXT,
  replied_at TIMESTAMPTZ,
  source TEXT NOT NULL DEFAULT 'google',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_google_reviews_business ON public.google_reviews(business_id);
ALTER TABLE public.google_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business users manage google reviews" ON public.google_reviews
  FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

-- Review automation settings per business
CREATE TABLE public.review_auto_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  delay_hours INTEGER NOT NULL DEFAULT 2,
  channel TEXT NOT NULL DEFAULT 'sms',
  message_template TEXT DEFAULT 'Hi {customer_name}, thank you for choosing us! We''d love your feedback. Please leave us a review: {review_link}',
  review_link TEXT,
  min_job_value NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id)
);

ALTER TABLE public.review_auto_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business users manage review settings" ON public.review_auto_settings
  FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

-- Add review_url and google_place_id to review_requests for tracking
ALTER TABLE public.review_requests
  ADD COLUMN IF NOT EXISTS review_url TEXT,
  ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'sms',
  ADD COLUMN IF NOT EXISTS auto_sent BOOLEAN DEFAULT false;

-- Trigger: auto-create review request when job is completed
CREATE OR REPLACE FUNCTION public.auto_review_request_on_job_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _settings record;
  _customer record;
BEGIN
  -- Only fire when status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    -- Check if auto review is enabled for this business
    SELECT * INTO _settings FROM public.review_auto_settings
    WHERE business_id = NEW.business_id AND is_enabled = true;

    IF _settings IS NULL THEN
      RETURN NEW;
    END IF;

    -- Check if customer exists
    IF NEW.tenant_customer_id IS NOT NULL THEN
      SELECT * INTO _customer FROM public.tenant_customers WHERE id = NEW.tenant_customer_id;

      -- Don't duplicate: check if review request already exists for this job
      IF NOT EXISTS (SELECT 1 FROM public.review_requests WHERE job_id = NEW.id) THEN
        INSERT INTO public.review_requests (
          business_id, tenant_customer_id, job_id, status, review_url, channel, auto_sent
        ) VALUES (
          NEW.business_id, NEW.tenant_customer_id, NEW.id, 'pending',
          _settings.review_link, _settings.channel, true
        );

        -- Log system event
        INSERT INTO public.system_events (business_id, event_type, payload_json)
        VALUES (NEW.business_id, 'AUTO_REVIEW_REQUEST', jsonb_build_object(
          'job_id', NEW.id,
          'customer_id', NEW.tenant_customer_id,
          'customer_name', _customer.name
        ));
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_review_on_job_complete
  AFTER UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_review_request_on_job_complete();
