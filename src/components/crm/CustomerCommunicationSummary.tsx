import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, MessageSquare, Calendar, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

interface CustomerCommunicationSummaryProps {
  clientId: string;
}

export function CustomerCommunicationSummary({ clientId }: CustomerCommunicationSummaryProps) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    setLoading(true);
    db.from("crm_call_communications")
      .select("id, start_time, call_status, connected, ai_synopsis_customer_safe, customer_safe_summary, customer_visibility_level, callback_required, callback_datetime, callback_status, duration_seconds")
      .eq("client_id", clientId)
      .in("customer_visibility_level", ["summary_only", "full_safe_summary"])
      .eq("visible_to_customer", true)
      .order("start_time", { ascending: false })
      .limit(20)
      .then(({ data, error }: any) => {
        if (error) console.error(error);
        setRecords(data || []);
        setLoading(false);
      });
  }, [clientId]);

  if (loading) {
    return <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Loading communication history…</CardContent></Card>;
  }

  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
          No communication summaries available yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Phone className="h-4 w-4" /> Communication Summary ({records.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-2 max-h-[400px] overflow-y-auto">
          {records.map((r) => (
            <div key={r.id} className="rounded-lg border p-3 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={r.connected ? "default" : "secondary"} className="text-[9px]">
                    {r.connected ? "Contacted" : "Attempted"}
                  </Badge>
                  {r.callback_required && r.callback_status === "pending" && (
                    <Badge variant="outline" className="text-[9px] border-blue-300 text-blue-700">
                      <Calendar className="h-2.5 w-2.5 mr-0.5" /> Follow-up scheduled
                    </Badge>
                  )}
                  {r.callback_status === "completed" && (
                    <Badge variant="outline" className="text-[9px] border-emerald-300 text-emerald-600">
                      <CheckCircle className="h-2.5 w-2.5 mr-0.5" /> Follow-up done
                    </Badge>
                  )}
                </div>
                <span className="text-muted-foreground text-[10px]">
                  {format(new Date(r.start_time), "dd MMM yyyy")}
                </span>
              </div>

              {(r.ai_synopsis_customer_safe || r.customer_safe_summary) && (
                <p className="text-muted-foreground leading-relaxed">
                  {r.customer_safe_summary || r.ai_synopsis_customer_safe}
                </p>
              )}

              {r.callback_datetime && r.callback_status === "pending" && (
                <p className="text-[10px] text-blue-600">
                  Next follow-up: {format(new Date(r.callback_datetime), "dd MMM yyyy 'at' HH:mm")}
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
