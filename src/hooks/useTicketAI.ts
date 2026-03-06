import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TicketAnalysis {
  sentiment: string;
  recommended_priority: string;
  category: string;
  tags: string[];
  summary: string;
  suggested_reply: string;
  escalation_risk: number;
  suggested_department?: string;
}

interface ReplySuggestion {
  style: string;
  text: string;
}

interface KBAnswer {
  answer: string;
  relevant_article_ids?: string[];
  confidence: number;
}

export function useTicketAI() {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<TicketAnalysis | null>(null);
  const [suggestingReplies, setSuggestingReplies] = useState(false);
  const [replySuggestions, setReplySuggestions] = useState<ReplySuggestion[]>([]);
  const [searchingKB, setSearchingKB] = useState(false);
  const [kbAnswer, setKBAnswer] = useState<KBAnswer | null>(null);

  const analyzeTicket = async (ticket: any) => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-engine", {
        body: { task_type: "ticket_analysis", payload: ticket },
      });
      if (error) throw error;
      setAnalysis(data?.result);
      return data?.result;
    } catch (e: any) {
      toast.error(e.message || "AI analysis failed");
      return null;
    } finally {
      setAnalyzing(false);
    }
  };

  const suggestReplies = async (ticket: any) => {
    setSuggestingReplies(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-engine", {
        body: { task_type: "ticket_reply_suggest", payload: ticket },
      });
      if (error) throw error;
      setReplySuggestions(data?.result?.replies || []);
      return data?.result?.replies || [];
    } catch (e: any) {
      toast.error(e.message || "Failed to generate replies");
      return [];
    } finally {
      setSuggestingReplies(false);
    }
  };

  const searchKB = async (query: string, articles: any[]) => {
    setSearchingKB(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-engine", {
        body: { task_type: "kb_search", payload: { query, articles } },
      });
      if (error) throw error;
      setKBAnswer(data?.result);
      return data?.result;
    } catch (e: any) {
      toast.error(e.message || "KB search failed");
      return null;
    } finally {
      setSearchingKB(false);
    }
  };

  return {
    analyzing, analysis, analyzeTicket,
    suggestingReplies, replySuggestions, suggestReplies,
    searchingKB, kbAnswer, searchKB,
  };
}
