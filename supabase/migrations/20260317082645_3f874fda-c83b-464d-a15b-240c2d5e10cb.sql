
-- Fix: ticket_messages already in realtime, just re-run the parts that failed
-- All previous statements succeeded except the last ALTER PUBLICATION
-- So this migration is a no-op confirmation
SELECT 1;
