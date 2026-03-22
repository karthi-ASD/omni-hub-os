/**
 * AI Call Assistant — provides live suggestions and coaching during calls.
 * Uses Lovable AI gateway via edge function. Non-blocking.
 */
import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { TranscriptLine } from "./useCallTranscript";

export interface AISuggestion {
  id: string;
  type: "reply" | "objection" | "close" | "question" | "follow_up";
  text: string;
  confidence?: number;
  createdAt: string;
}

export interface AICoachingInsight {
  id: string;
  intent: string;
  sentiment: "positive" | "neutral" | "negative";
  risk: "low" | "medium" | "high";
  opportunity: string;
  tips: string[];
  missedOpportunities: string[];
  talkListenBalance: string;
  closeReadiness: "not_ready" | "warming" | "ready";
  createdAt: string;
}

export type AIAssistStatus = "idle" | "active" | "processing" | "failed";

interface UseAICallAssistantOptions {
  sessionId: string | null;
  businessId: string | null;
  onLog?: (event: string, data?: Record<string, unknown>) => void;
}

export function useAICallAssistant({
  sessionId,
  businessId,
  onLog,
}: UseAICallAssistantOptions) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [coaching, setCoaching] = useState<AICoachingInsight | null>(null);
  const [status, setStatus] = useState<AIAssistStatus>("idle");
  const lastRequestRef = useRef<number>(0);
  const processingRef = useRef(false);
  const MIN_INTERVAL_MS = 8000; // Don't request more than every 8s

  const log = useCallback(
    (event: string, data?: Record<string, unknown>) => onLog?.(event, data),
    [onLog]
  );

  const requestAIAssist = useCallback(
    async (transcriptLines: TranscriptLine[], disposition?: string) => {
      if (processingRef.current) return;
      const now = Date.now();
      if (now - lastRequestRef.current < MIN_INTERVAL_MS) return;
      if (transcriptLines.length === 0) return;

      lastRequestRef.current = now;
      processingRef.current = true;
      setStatus("processing");
      log("AI_SUGGESTION_REQUEST");
      log("AI_COACH_REQUEST");

      try {
        // Get last ~10 final transcript lines for context
        const recentLines = transcriptLines
          .filter((l) => l.isFinal)
          .slice(-10)
          .map((l) => `[${l.speaker}]: ${l.text}`)
          .join("\n");

        if (!recentLines.trim()) {
          processingRef.current = false;
          return;
        }

        const { data, error } = await supabase.functions.invoke("dialer-ai-assist", {
          body: {
            transcript: recentLines,
            session_id: sessionId,
            business_id: businessId,
            disposition: disposition || null,
          },
        });

        if (error) throw error;

        if (data?.suggestions) {
          const mapped: AISuggestion[] = (data.suggestions as any[]).map(
            (s: any, i: number) => ({
              id: `sug-${now}-${i}`,
              type: s.type || "reply",
              text: s.text,
              confidence: s.confidence,
              createdAt: new Date().toISOString(),
            })
          );
          setSuggestions(mapped);
          log("AI_SUGGESTION_RECEIVED", { count: mapped.length });
          log("AI_SUGGESTION_RENDERED", { count: mapped.length });
        }

        if (data?.coaching) {
          const c = data.coaching;
          const insight: AICoachingInsight = {
            id: `coach-${now}`,
            intent: c.intent || "Unknown",
            sentiment: c.sentiment || "neutral",
            risk: c.risk || "low",
            opportunity: c.opportunity || "",
            tips: c.tips || [],
            missedOpportunities: c.missed_opportunities || [],
            talkListenBalance: c.talk_listen_balance || "balanced",
            closeReadiness: c.close_readiness || "not_ready",
            createdAt: new Date().toISOString(),
          };
          setCoaching(insight);
          log("AI_COACH_UPDATE_RECEIVED");
          log("AI_COACH_RENDERED");
        }

        setStatus("active");
      } catch (err) {
        log("AI_SUGGESTION_FAILED", { error: String(err) });
        log("AI_COACH_FAILED", { error: String(err) });
        setStatus("failed");
      } finally {
        processingRef.current = false;
      }
    },
    [sessionId, businessId, log]
  );

  const markSuggestionCopied = useCallback(
    (id: string) => {
      log("AI_SUGGESTION_COPIED", { id });
      setSuggestions((prev) =>
        prev.map((s) => (s.id === id ? { ...s } : s))
      );
    },
    [log]
  );

  const resetAssistant = useCallback(() => {
    setSuggestions([]);
    setCoaching(null);
    setStatus("idle");
    processingRef.current = false;
  }, []);

  return {
    suggestions,
    coaching,
    status,
    requestAIAssist,
    markSuggestionCopied,
    resetAssistant,
  };
}
