
-- =====================================================
-- STAGE 2: notifications, calendar_events, dashboard_widgets
-- =====================================================

-- Notification type enum
CREATE TYPE public.notification_type AS ENUM ('info', 'warning', 'system', 'reminder');

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id),
  user_id UUID NOT NULL,
  type notification_type NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE NOT is_read;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Calendar events table
CREATE TYPE public.calendar_visibility AS ENUM ('private', 'tenant');

CREATE TABLE public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  title TEXT NOT NULL,
  description TEXT,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  created_by_user_id UUID NOT NULL,
  visibility calendar_visibility NOT NULL DEFAULT 'tenant',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_calendar_events_business ON public.calendar_events(business_id);
CREATE INDEX idx_calendar_events_dates ON public.calendar_events(business_id, start_datetime, end_datetime);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Tenant users can view tenant events (or own private events)
CREATE POLICY "Users can view tenant calendar events"
  ON public.calendar_events FOR SELECT
  USING (
    business_id = get_user_business_id(auth.uid())
    AND (visibility = 'tenant' OR created_by_user_id = auth.uid())
  );

-- Super admins see all
CREATE POLICY "Super admins can manage all calendar events"
  ON public.calendar_events FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Business admins + managers can insert/update/delete tenant events
CREATE POLICY "Business admins can manage tenant calendar events"
  ON public.calendar_events FOR ALL
  USING (
    (has_role(auth.uid(), 'business_admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
    AND business_id = get_user_business_id(auth.uid())
  );

-- Creators can manage own events
CREATE POLICY "Users can manage own calendar events"
  ON public.calendar_events FOR ALL
  USING (created_by_user_id = auth.uid());

-- Updated_at trigger for calendar_events
CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
