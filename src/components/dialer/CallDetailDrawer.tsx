import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchSessionAILog, fetchCallTags } from "@/services/dialerService";
import { formatTalkTime } from "@/hooks/useDialerMetrics";
import { format } from "date-fns";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Brain, Clock, Phone, Play, Tag, FileText, User, Activity } from "lucide-react";

interface CallDetailDrawerProps {
  sessionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CallDetailDrawer({ sessionId, open, onOpenChange }: CallDetailDrawerProps) {
  const { data: session } = useQuery({
    queryKey: ["dialer-session-detail", sessionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("dialer_sessions")
        .select("*")
        .eq("id", sessionId!)
        .single();
      return data as any;
    },
    enabled: !!sessionId && open,
  });

  const { data: aiLog } = useQuery({
    queryKey: ["dialer-ai-detail", sessionId],
    queryFn: () => fetchSessionAILog(sessionId!),
    enabled: !!sessionId && open,
  });

  const { data: tags } = useQuery({
    queryKey: ["dialer-tags-detail", sessionId],
    queryFn: () => fetchCallTags(sessionId!),
    enabled: !!sessionId && open,
  });

  const { data: events } = useQuery({
    queryKey: ["dialer-events-detail", sessionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("dialer_call_events")
        .select("*")
        .eq("session_id", sessionId!)
        .order("created_at", { ascending: true });
      return (data as any[]) || [];
    },
    enabled: !!sessionId && open,
  });

  const { data: callerProfile } = useQuery({
    queryKey: ["dialer-caller-profile", session?.user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("user_id", session.user_id)
        .single();
      return data as any;
    },
    enabled: !!session?.user_id,
  });

  const { data: leadInfo } = useQuery({
    queryKey: ["dialer-lead-info", session?.lead_id],
    queryFn: async () => {
      const { data } = await supabase.from("leads").select("name, company_name").eq("id", session.lead_id).single();
      return data as any;
    },
    enabled: !!session?.lead_id,
  });

  if (!session) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2"><Phone className="h-4 w-4" /> Call Details</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 mt-4">
          {/* Caller & Contact */}
          <section className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Participants</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground">Caller:</span> {callerProfile?.full_name || "—"}</div>
              <div><span className="text-muted-foreground">Email:</span> {callerProfile?.email || "—"}</div>
              {leadInfo && <div><span className="text-muted-foreground">Lead:</span> {leadInfo.name}</div>}
              {leadInfo?.company_name && <div><span className="text-muted-foreground">Company:</span> {leadInfo.company_name}</div>}
              <div><span className="text-muted-foreground">Phone:</span> <span className="font-mono">{session.phone_number}</span></div>
              <div><span className="text-muted-foreground">Status:</span> <Badge variant="outline" className="capitalize text-[10px]">{session.call_status?.replace("-", " ")}</Badge></div>
            </div>
          </section>

          <Separator />

          {/* Timing */}
          <section className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Timing</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground">Start:</span> {session.call_start_time ? format(new Date(session.call_start_time), "MMM d, h:mm:ss a") : "—"}</div>
              <div><span className="text-muted-foreground">End:</span> {session.call_end_time ? format(new Date(session.call_end_time), "MMM d, h:mm:ss a") : "—"}</div>
              <div><span className="text-muted-foreground">Duration:</span> {formatTalkTime(session.call_duration || 0)}</div>
              <div><span className="text-muted-foreground">Bill Duration:</span> {formatTalkTime(session.bill_duration || 0)}</div>
              {session.call_cost != null && <div><span className="text-muted-foreground">Cost:</span> ${session.call_cost.toFixed(4)}</div>}
            </div>
          </section>

          <Separator />

          {/* Recording */}
          {session.recording_url && (
            <>
              <section className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Play className="h-3.5 w-3.5" /> Recording</h4>
                <audio controls className="w-full" src={session.recording_url} preload="none" />
                <a href={session.recording_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Open in new tab</a>
              </section>
              <Separator />
            </>
          )}

          {/* AI Analysis */}
          <section className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Brain className="h-3.5 w-3.5" /> AI Analysis</h4>
            {aiLog ? (
              <div className="space-y-1.5 text-sm">
                <div><span className="text-muted-foreground">Score:</span> <span className="font-semibold tabular-nums">{aiLog.score ?? session.ai_score ?? "—"}</span></div>
                <div><span className="text-muted-foreground">Sentiment:</span> <Badge variant="outline" className="capitalize text-[10px]">{aiLog.sentiment || "—"}</Badge></div>
                <div><span className="text-muted-foreground">Summary:</span> {aiLog.summary || session.ai_summary || "—"}</div>
                {aiLog.next_action && <div><span className="text-muted-foreground">Next Action:</span> {aiLog.next_action}</div>}
                {aiLog.priority && <div><span className="text-muted-foreground">Priority:</span> <Badge variant="outline" className="capitalize text-[10px]">{aiLog.priority}</Badge></div>}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No AI analysis available</p>
            )}
          </section>

          <Separator />

          {/* Disposition & Notes */}
          <section className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Disposition</h4>
            <div className="text-sm space-y-1">
              <div><span className="text-muted-foreground">Outcome:</span> <Badge variant="outline" className="capitalize text-[10px]">{session.disposition?.replace("_", " ") || "—"}</Badge></div>
              {session.notes && <div><span className="text-muted-foreground">Notes:</span> {session.notes}</div>}
            </div>
          </section>

          {/* Tags */}
          {tags && tags.length > 0 && (
            <>
              <Separator />
              <section className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" /> Tags</h4>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t: any, i: number) => (
                    <Badge key={i} variant="secondary" className="text-[10px] capitalize">{t.tag?.replace("_", " ")}</Badge>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* Call Events Timeline */}
          {events && events.length > 0 && (
            <>
              <Separator />
              <section className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Activity className="h-3.5 w-3.5" /> Event Timeline</h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {events.map((ev: any) => (
                    <div key={ev.id} className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground font-mono tabular-nums">{format(new Date(ev.created_at), "HH:mm:ss")}</span>
                      <Badge variant="outline" className="text-[9px] capitalize">{ev.event_type?.replace("_", " ")}</Badge>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* IDs */}
          <Separator />
          <section className="space-y-1 text-[10px] text-muted-foreground/60 font-mono">
            <div>Session: {session.id}</div>
            {session.provider_call_id && <div>Provider: {session.provider_call_id}</div>}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
