import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, X, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BroadcastAlert {
  id: string;
  title: string;
  message: string | null;
  priority_level: string;
  created_at: string;
}

const priorityColors: Record<string, string> = {
  normal: "bg-primary/10 text-primary border-primary/20",
  important: "bg-warning/10 text-warning border-warning/20",
  mandatory: "bg-destructive/10 text-destructive border-destructive/20",
};

export function BroadcastPopup() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<BroadcastAlert[]>([]);

  const dismiss = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    // Remember dismissed in sessionStorage so it doesn't reappear on navigation
    const dismissed = JSON.parse(sessionStorage.getItem("dismissed_broadcasts") || "[]");
    sessionStorage.setItem("dismissed_broadcasts", JSON.stringify([...dismissed, id]));
  }, []);

  useEffect(() => {
    if (!profile?.business_id) return;

    const channel = supabase
      .channel("broadcast-popup")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "daily_insights",
          filter: `business_id=eq.${profile.business_id}`,
        },
        (payload) => {
          const row = payload.new as any;
          if (row.status !== "published") return;
          const dismissed = JSON.parse(sessionStorage.getItem("dismissed_broadcasts") || "[]");
          if (dismissed.includes(row.id)) return;

          setAlerts((prev) => [
            {
              id: row.id,
              title: row.title,
              message: row.message,
              priority_level: row.priority_level || "normal",
              created_at: row.created_at,
            },
            ...prev,
          ]);

          // Auto-dismiss after 15 seconds for normal priority
          if (row.priority_level === "normal") {
            setTimeout(() => dismiss(row.id), 15000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.business_id, dismiss]);

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-16 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {alerts.map((alert) => (
        <Card
          key={alert.id}
          className={`pointer-events-auto animate-slide-in-right border shadow-lg ${priorityColors[alert.priority_level] || ""}`}
        >
          <CardContent className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 shrink-0" />
                <span className="text-xs font-semibold uppercase tracking-wide">Broadcast</span>
                <Badge variant="outline" className="text-[10px] capitalize">
                  {alert.priority_level}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => dismiss(alert.id)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            <p className="text-sm font-semibold leading-snug">{alert.title}</p>

            {alert.message && (
              <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-6">
                {alert.message}
              </p>
            )}

            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => {
                  dismiss(alert.id);
                  navigate("/internal-broadcast");
                }}
              >
                <ExternalLink className="h-3 w-3" /> View Details
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => dismiss(alert.id)}
              >
                Mark as Read
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
