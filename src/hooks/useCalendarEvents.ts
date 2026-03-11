import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  start_datetime: string;
  end_datetime: string;
  visibility: string;
  location: string | null;
  attendees: string[] | null;
  recurrence_rule: string | null;
  created_by_user_id: string;
  business_id: string;
  created_at: string;
}

export function useCalendarEvents(month?: Date) {
  const { profile } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    if (!profile) return;

    let query = supabase
      .from("calendar_events")
      .select("*")
      .order("start_datetime", { ascending: true });

    if (month) {
      const start = new Date(month.getFullYear(), month.getMonth(), 1);
      const end = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);
      query = query
        .gte("start_datetime", start.toISOString())
        .lte("start_datetime", end.toISOString());
    }

    const { data } = await query;
    setEvents((data as any as CalendarEvent[]) ?? []);
    setLoading(false);
  }, [profile, month]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const createEvent = async (event: {
    title: string;
    description?: string;
    start_datetime: string;
    end_datetime: string;
    visibility?: string;
    location?: string;
    attendees?: string[];
    recurrence_rule?: string;
  }) => {
    if (!profile?.business_id) return null;
    const { data, error } = await supabase
      .from("calendar_events")
      .insert({
        title: event.title,
        description: event.description || null,
        start_datetime: event.start_datetime,
        end_datetime: event.end_datetime,
        business_id: profile.business_id,
        created_by_user_id: profile.user_id,
        visibility: (event.visibility || "tenant") as "private" | "tenant",
        location: event.location || null,
        attendees: event.attendees || [],
        recurrence_rule: event.recurrence_rule || null,
      } as any)
      .select()
      .single();

    if (!error) {
      fetchEvents();
    }
    return { data, error };
  };

  const deleteEvent = async (id: string) => {
    const { error } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", id);
    if (!error) fetchEvents();
    return error;
  };

  return { events, loading, createEvent, deleteEvent, refresh: fetchEvents };
}
