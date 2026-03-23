import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Clock, CheckCircle, AlertTriangle, Calendar, User, Loader2 } from "lucide-react";
import { format, isToday, isTomorrow, isPast, isThisWeek } from "date-fns";
import { toast } from "sonner";
import { getPendingCallbacks, updateCallbackStatus } from "@/services/crmCommunicationService";

interface CallbacksPanelProps {
  businessId: string;
  userId?: string;
  entityType?: string;
  entityId?: string;
  showAllStatuses?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  missed: "bg-destructive/20 text-destructive",
  rescheduled: "bg-blue-100 text-blue-700",
  cancelled: "bg-muted text-muted-foreground",
};

export function CallbacksPanel({ businessId, userId, entityType, entityId, showAllStatuses }: CallbacksPanelProps) {
  const [callbacks, setCallbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchCallbacks = async () => {
    setLoading(true);
    const data = await getPendingCallbacks(businessId, userId, showAllStatuses ? { status: undefined } : undefined);
    // Filter by entity if provided
    const filtered = entityId
      ? data.filter((cb: any) => cb.entity_id === entityId || cb.lead_id === entityId || cb.client_id === entityId || cb.project_id === entityId)
      : data;
    setCallbacks(filtered);
    setLoading(false);
  };

  useEffect(() => {
    if (!businessId) return;
    fetchCallbacks();
  }, [businessId, userId, entityId]);

  const handleStatusUpdate = async (id: string, status: "completed" | "missed" | "cancelled") => {
    setUpdating(id);
    await updateCallbackStatus(id, status);
    toast.success(`Callback marked as ${status}`);
    await fetchCallbacks();
    setUpdating(null);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Loading callbacks…
        </CardContent>
      </Card>
    );
  }

  const today = callbacks.filter((cb) => cb.callback_datetime && isToday(new Date(cb.callback_datetime)) && cb.status === "pending");
  const upcoming = callbacks.filter((cb) => cb.callback_datetime && !isPast(new Date(cb.callback_datetime)) && !isToday(new Date(cb.callback_datetime)) && cb.status === "pending");
  const overdue = callbacks.filter((cb) => cb.callback_datetime && isPast(new Date(cb.callback_datetime)) && !isToday(new Date(cb.callback_datetime)) && cb.status === "pending");
  const completed = callbacks.filter((cb) => cb.status === "completed");

  const renderRow = (cb: any, isOverdue = false) => {
    const comm = cb.crm_call_communications;
    return (
      <div key={cb.id} className={`rounded-lg border p-3 space-y-1.5 text-xs ${isOverdue ? "border-destructive/40 bg-destructive/5" : ""}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isOverdue && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
            <Badge className={`text-[9px] ${STATUS_COLORS[cb.status] || "bg-muted"}`}>{cb.status}</Badge>
            {comm?.matched_name && (
              <span className="font-medium text-foreground">{comm.matched_name}</span>
            )}
          </div>
          <span className="text-muted-foreground text-[10px] flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {cb.callback_datetime ? format(new Date(cb.callback_datetime), "dd MMM yyyy HH:mm") : "—"}
          </span>
        </div>

        <div className="flex items-center gap-3 text-muted-foreground">
          {comm?.phone_number_raw && (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" /> {comm.phone_number_raw}
            </span>
          )}
          {cb.callback_reason && <span className="italic">{cb.callback_reason}</span>}
        </div>

        {cb.status === "pending" && (
          <div className="flex items-center gap-1.5 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-[10px] text-emerald-600 border-emerald-300"
              disabled={updating === cb.id}
              onClick={() => handleStatusUpdate(cb.id, "completed")}
            >
              {updating === cb.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3 mr-0.5" />}
              Complete
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-[10px] text-destructive border-destructive/30"
              disabled={updating === cb.id}
              onClick={() => handleStatusUpdate(cb.id, "missed")}
            >
              Missed
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-[10px]"
              disabled={updating === cb.id}
              onClick={() => handleStatusUpdate(cb.id, "cancelled")}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    );
  };

  const hasAny = today.length > 0 || upcoming.length > 0 || overdue.length > 0 || completed.length > 0;

  if (!hasAny) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          <Phone className="h-8 w-8 mx-auto mb-2 opacity-40" />
          No callbacks scheduled.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {overdue.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" /> Overdue ({overdue.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-2">
            {overdue.map((cb) => renderRow(cb, true))}
          </CardContent>
        </Card>
      )}

      {today.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" /> Today ({today.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-2">
            {today.map((cb) => renderRow(cb))}
          </CardContent>
        </Card>
      )}

      {upcoming.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Upcoming ({upcoming.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-2 max-h-[300px] overflow-y-auto">
            {upcoming.map((cb) => renderRow(cb))}
          </CardContent>
        </Card>
      )}

      {showAllStatuses && completed.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2 text-emerald-600">
              <CheckCircle className="h-4 w-4" /> Completed ({completed.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-2 max-h-[300px] overflow-y-auto">
            {completed.map((cb) => renderRow(cb))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
