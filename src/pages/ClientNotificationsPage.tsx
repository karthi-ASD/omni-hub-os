import { useClientNotifications, ClientNotificationFilter } from "@/hooks/useClientNotifications";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, CheckCheck, Filter } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const filterOptions: { value: ClientNotificationFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "system", label: "System Alerts" },
  { value: "warning", label: "Domain / Hosting Alerts" },
  { value: "info", label: "Ticket Updates" },
  { value: "reminder", label: "Reminders" },
];

const typeBadgeVariant = (type: string) => {
  switch (type) {
    case "warning": return "destructive" as const;
    case "system": return "secondary" as const;
    case "reminder": return "outline" as const;
    default: return "default" as const;
  }
};

const ClientNotificationsPage = () => {
  usePageTitle("My Notifications");
  const {
    notifications, unreadCount, loading, filter, setFilter,
    markAsRead, markAllRead,
  } = useClientNotifications();

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Notifications</h1>
            <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} className="gap-2">
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {filterOptions.map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? "default" : "outline"}
            size="sm"
            className="text-xs h-7"
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              {filter === "all" ? "No notifications yet" : "No notifications match this filter"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`transition-colors ${!n.is_read ? "border-primary/30 bg-primary/5" : ""}`}
            >
              <CardContent className="flex items-start gap-3 py-4">
                <div className={`h-2 w-2 rounded-full mt-2 shrink-0 ${n.is_read ? "bg-muted" : "bg-primary"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm ${n.is_read ? "text-muted-foreground" : "font-medium text-foreground"}`}>
                      {n.title}
                    </p>
                    <Badge variant={typeBadgeVariant(n.type)} className="text-[10px]">
                      {n.type}
                    </Badge>
                    {!n.is_read && (
                      <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                        New
                      </Badge>
                    )}
                  </div>
                  {n.message && (
                    <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
                {!n.is_read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-8 w-8"
                    onClick={() => markAsRead(n.id)}
                  >
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

export default ClientNotificationsPage;
