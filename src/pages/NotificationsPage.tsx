import { useNotifications } from "@/hooks/useNotifications";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const NotificationsPage = () => {
  const { notifications, unreadCount, loading, markAsRead, markAllRead } = useNotifications();

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "warning": return "destructive" as const;
      case "system": return "secondary" as const;
      case "reminder": return "outline" as const;
      default: return "default" as const;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Notifications"
        subtitle={`${unreadCount} unread`}
        icon={Bell}
        actions={unreadCount > 0 ? [{ label: "Mark all read", icon: CheckCheck, onClick: markAllRead, variant: "outline" as const }] : []}
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : notifications.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="py-12 text-center">
            <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No notifications yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`rounded-2xl border-0 shadow-elevated hover-lift transition-all ${!n.is_read ? "ring-1 ring-primary/20" : ""}`}
            >
              <CardContent className="flex items-start gap-3 py-4">
                <div className={`h-2 w-2 rounded-full mt-2 shrink-0 ${n.is_read ? "bg-muted" : "bg-primary"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm ${n.is_read ? "text-muted-foreground" : "font-medium"}`}>
                      {n.title}
                    </p>
                    <Badge variant={getTypeBadgeVariant(n.type)} className="text-[10px]">
                      {n.type}
                    </Badge>
                  </div>
                  {n.message && (
                    <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
                {!n.is_read && (
                  <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => markAsRead(n.id)}>
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
