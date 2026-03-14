import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface BroadcastPoll {
  id: string;
  insight_id: string;
  business_id: string;
  question: string;
  is_active: boolean;
  created_at: string;
}

export interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  sort_order: number;
}

export interface PollVote {
  id: string;
  poll_id: string;
  option_id: string;
  employee_id: string;
  business_id: string;
  voted_at: string;
}

export function useBroadcastPolls(insightId?: string) {
  const { user, profile } = useAuth();
  const [polls, setPolls] = useState<BroadcastPoll[]>([]);
  const [options, setOptions] = useState<PollOption[]>([]);
  const [votes, setVotes] = useState<PollVote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!profile?.business_id) return;
    setLoading(true);

    const pollQuery = supabase
      .from("broadcast_polls")
      .select("*")
      .eq("business_id", profile.business_id);
    if (insightId) pollQuery.eq("insight_id", insightId);

    const { data: pollData } = await pollQuery;
    const pollList = (pollData as any[]) ?? [];
    setPolls(pollList);

    if (pollList.length > 0) {
      const pollIds = pollList.map((p) => p.id);

      const [optRes, voteRes] = await Promise.all([
        supabase.from("broadcast_poll_options").select("*").in("poll_id", pollIds).order("sort_order"),
        supabase.from("broadcast_poll_votes").select("*").in("poll_id", pollIds),
      ]);

      setOptions((optRes.data as any[]) ?? []);
      setVotes((voteRes.data as any[]) ?? []);
    } else {
      setOptions([]);
      setVotes([]);
    }

    setLoading(false);
  }, [profile?.business_id, insightId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const createPoll = async (iInsightId: string, question: string, optionTexts: string[]) => {
    if (!profile?.business_id) return;

    const { data: poll, error } = await supabase
      .from("broadcast_polls")
      .insert({ insight_id: iInsightId, business_id: profile.business_id, question } as any)
      .select()
      .single();

    if (error || !poll) { toast.error("Failed to create poll"); return; }

    const optInserts = optionTexts.map((text, i) => ({
      poll_id: (poll as any).id,
      option_text: text,
      sort_order: i,
    }));

    await supabase.from("broadcast_poll_options").insert(optInserts as any);
    toast.success("Poll attached!");
    fetchAll();
  };

  const castVote = async (pollId: string, optionId: string) => {
    if (!user || !profile?.business_id) return;

    const existing = votes.find((v) => v.poll_id === pollId && v.employee_id === user.id);
    if (existing) { toast.info("You have already voted"); return; }

    const { error } = await supabase.from("broadcast_poll_votes").insert({
      poll_id: pollId,
      option_id: optionId,
      employee_id: user.id,
      business_id: profile.business_id,
    } as any);

    if (error) { toast.error("Failed to submit vote"); return; }
    toast.success("Vote recorded!");
    fetchAll();
  };

  const myVote = (pollId: string) => votes.find((v) => v.poll_id === pollId && v.employee_id === user?.id);

  const getResults = (pollId: string) => {
    const pollOpts = options.filter((o) => o.poll_id === pollId);
    const pollVotes = votes.filter((v) => v.poll_id === pollId);
    const total = pollVotes.length;

    return pollOpts.map((opt) => {
      const count = pollVotes.filter((v) => v.option_id === opt.id).length;
      return {
        ...opt,
        votes: count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      };
    });
  };

  return { polls, options, votes, loading, createPoll, castVote, myVote, getResults, refresh: fetchAll };
}
