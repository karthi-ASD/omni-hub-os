import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BoardMember {
  id: string;
  name: string;
  role: string;
  voting_power: number;
  appointed_at: string;
}

export interface BoardMeeting {
  id: string;
  meeting_date: string;
  agenda: string | null;
  minutes: string | null;
  resolution_summary: string | null;
  created_at: string;
}

export interface Resolution {
  id: string;
  meeting_id: string | null;
  resolution_text: string;
  vote_result: string;
  created_at: string;
}

export function useGovernance() {
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [meetings, setMeetings] = useState<BoardMeeting[]>([]);
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [m, mt, r] = await Promise.all([
      supabase.from("board_members").select("*").order("appointed_at", { ascending: false }),
      supabase.from("board_meetings").select("*").order("meeting_date", { ascending: false }),
      supabase.from("resolutions").select("*").order("created_at", { ascending: false }),
    ]);
    setMembers((m.data as any) || []);
    setMeetings((mt.data as any) || []);
    setResolutions((r.data as any) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addMember = async (member: { name: string; role: string; voting_power?: number }) => {
    const { error } = await supabase.from("board_members").insert(member as any);
    if (error) { toast.error(error.message); return false; }
    toast.success("Board member added");
    fetchAll();
    return true;
  };

  const addMeeting = async (meeting: { meeting_date: string; agenda?: string }) => {
    const { error } = await supabase.from("board_meetings").insert(meeting as any);
    if (error) { toast.error(error.message); return false; }
    toast.success("Meeting scheduled");
    fetchAll();
    return true;
  };

  const addResolution = async (res: { meeting_id: string; resolution_text: string }) => {
    const { error } = await supabase.from("resolutions").insert(res as any);
    if (error) { toast.error(error.message); return false; }
    toast.success("Resolution added");
    fetchAll();
    return true;
  };

  return { members, meetings, resolutions, loading, addMember, addMeeting, addResolution, refetch: fetchAll };
}
