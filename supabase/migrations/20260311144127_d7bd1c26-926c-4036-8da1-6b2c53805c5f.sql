
-- Add missing calendar event fields
ALTER TABLE public.calendar_events 
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS attendees TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS recurrence_rule TEXT;
