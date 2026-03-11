import { useClientNotifications } from "@/hooks/useClientNotifications";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

export function ClientNotificationBell() {
  const { allNotifications, unreadCount, markAsRead, markAllRead } = useClientNotifications();
  const navigate = useNavigate();
  const recent = allNotifications.slice(0, 5);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2">
          <p className="text-sm font-semibold">Notifications</p>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={markAllRead}>
              <CheckCheck className="h-3 w-3" /> Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {recent.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          recent.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className="flex items-start gap-3 py-3 cursor-pointer"
              onClick={() => {
                if (!n.is_read) markAsRead(n.id);
              }}
            >
              <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${n.is_read ? "bg-transparent" : "bg-primary"}`} />
              <div className="min-w-0 flex-1">
                <p className={`text-sm truncate ${n.is_read ? "text-muted-foreground" : "font-medium"}`}>
                  {n.title}
                </p>
                {n.message && (
                  <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                )}
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </p>
              </div>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-center justify-center text-sm text-primary cursor-pointer"
          onClick={() => navigate("/client-notifications")}
        >
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
