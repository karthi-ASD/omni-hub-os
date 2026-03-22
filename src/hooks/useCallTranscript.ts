/**
 * Live call transcript using browser SpeechRecognition API.
 * Captures agent-side audio in near real-time during active calls.
 * Non-blocking — failures do not affect the call.
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TranscriptLine {
  id: string;
  speaker: "agent" | "customer";
  text: string;
  timestampMs: number;
  isFinal: boolean;
  confidence?: number;
}

export type TranscriptStatus = "idle" | "connecting" | "live" | "delayed" | "failed" | "stopped";

interface UseCallTranscriptOptions {
  sessionId: string | null;
  businessId: string | null;
  userId: string | null;
  /** Must be true ONLY when call status is "connected" — not dialing/ringing */
  isCallConnected: boolean;
  onLog?: (event: string, data?: Record<string, unknown>) => void;
}

export function useCallTranscript({
  sessionId,
  businessId,
  userId,
  isCallActive,
  onLog,
}: UseCallTranscriptOptions) {
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [status, setStatus] = useState<TranscriptStatus>("idle");
  const recognitionRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  const linesRef = useRef<TranscriptLine[]>([]);
  const shouldRestartRef = useRef(false);

  const log = useCallback(
    (event: string, data?: Record<string, unknown>) => {
      onLog?.(event, data);
    },
    [onLog]
  );

  const addLine = useCallback((line: TranscriptLine) => {
    setLines((prev) => {
      // Update existing interim line or append
      const existing = prev.findIndex((l) => !l.isFinal && l.speaker === line.speaker);
      let next: TranscriptLine[];
      if (!line.isFinal && existing >= 0) {
        next = [...prev];
        next[existing] = line;
      } else if (line.isFinal && existing >= 0) {
        next = [...prev];
        next[existing] = line;
      } else {
        next = [...prev, line];
      }
      // Keep last 200 lines
      if (next.length > 200) next = next.slice(-200);
      linesRef.current = next;
      return next;
    });
  }, []);

  const startTranscription = useCallback(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      log("TRANSCRIPT_STREAM_FAILED", { reason: "SpeechRecognition not supported" });
      setStatus("failed");
      return;
    }

    log("TRANSCRIPT_STREAM_STARTED");
    setStatus("connecting");
    startTimeRef.current = Date.now();
    shouldRestartRef.current = true;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-AU";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      log("TRANSCRIPT_PROVIDER_CONNECTED");
      setStatus("live");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript.trim();
        if (!text) continue;

        const line: TranscriptLine = {
          id: `${Date.now()}-${i}`,
          speaker: "agent",
          text,
          timestampMs: Date.now() - startTimeRef.current,
          isFinal: result.isFinal,
          confidence: result[0].confidence,
        };

        log("TRANSCRIPT_CHUNK_RECEIVED", { isFinal: result.isFinal, length: text.length });
        addLine(line);

        // Save final results to DB
        if (result.isFinal && sessionId && businessId) {
          void supabase
            .from("dialer_transcripts")
            .insert({
              session_id: sessionId,
              business_id: businessId,
              user_id: userId,
              speaker: "agent",
              text,
              timestamp_ms: Date.now() - startTimeRef.current,
              is_final: true,
              confidence: result[0].confidence,
            } as any)
            .then(() => log("TRANSCRIPT_SAVED"));
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      log("TRANSCRIPT_STREAM_FAILED", { error: event.error });
      if (event.error === "no-speech" || event.error === "aborted") {
        // These are recoverable - just restart
        setStatus("delayed");
      } else {
        setStatus("failed");
        shouldRestartRef.current = false;
      }
    };

    recognition.onend = () => {
      // Auto-restart if call is still active
      if (shouldRestartRef.current) {
        try {
          setTimeout(() => {
            if (shouldRestartRef.current && recognitionRef.current) {
              recognitionRef.current.start();
            }
          }, 300);
        } catch {}
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (err) {
      log("TRANSCRIPT_STREAM_FAILED", { reason: String(err) });
      setStatus("failed");
    }
  }, [sessionId, businessId, userId, log, addLine]);

  const stopTranscription = useCallback(async () => {
    shouldRestartRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setStatus("stopped");

    // Save finalized transcript
    if (sessionId && businessId && linesRef.current.length > 0) {
      const finalLines = linesRef.current.filter((l) => l.isFinal);
      const fullText = finalLines.map((l) => `[${l.speaker}] ${l.text}`).join("\n");
      const segments = finalLines.map((l) => ({
        speaker: l.speaker,
        text: l.text,
        timestampMs: l.timestampMs,
        confidence: l.confidence,
      }));

      try {
        await supabase.from("dialer_call_transcripts").upsert(
          {
            session_id: sessionId,
            business_id: businessId,
            user_id: userId,
            full_transcript: fullText,
            speaker_segments: segments,
            word_count: fullText.split(/\s+/).length,
            duration_seconds: Math.round((Date.now() - startTimeRef.current) / 1000),
            source: "browser_speech_api",
            status: "completed",
          } as any,
          { onConflict: "session_id" }
        );
        log("TRANSCRIPT_SAVED");
      } catch {}
    }
  }, [sessionId, businessId, userId, log]);

  // Auto-start/stop based on call state
  useEffect(() => {
    if (isCallActive && sessionId && status === "idle") {
      startTranscription();
    }
    if (!isCallActive && status !== "idle" && status !== "stopped") {
      stopTranscription();
    }
  }, [isCallActive, sessionId, startTranscription, stopTranscription, status]);

  const clearTranscript = useCallback(() => {
    setLines([]);
    linesRef.current = [];
    setStatus("idle");
  }, []);

  return {
    lines,
    status,
    startTranscription,
    stopTranscription,
    clearTranscript,
  };
}
