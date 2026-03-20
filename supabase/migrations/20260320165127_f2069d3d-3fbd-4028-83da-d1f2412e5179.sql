ALTER TABLE public.dialer_call_events 
  ADD CONSTRAINT uq_dialer_call_events_session_event_ts 
  UNIQUE (session_id, event_type, created_at);