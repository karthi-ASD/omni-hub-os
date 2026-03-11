import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ClientNotification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
  client_id: string | null;
}

export type ClientNotificationFilter = "all" | "unread" | "system" | "warning" | "info" | "reminder";

export function useClientNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<ClientNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ClientNotificationFilter>("all");

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    // Fetch all notifications for this user (both user_id and client_id based)
    const { data } = await supabase
      .from("notifications")
      .select("id, type, title, message, is_read, created_at, client_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200);

    const items = (data ?? []) as ClientNotification[];
    setNotifications(items);
    setUnreadCount(items.filter((n) => !n.is_read).length);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchNotifications();

    if (!user) return;
    const channel = supabase
      .channel("client-notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchNotifications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications, user]);

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    fetchNotifications();
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    fetchNotifications();
  };

  const filtered = notifications.filter((n) => {
    switch (filter) {
      case "unread":
        return !n.is_read;
      case "system":
        return n.type === "system";
      case "warning":
        return n.type === "warning";
      case "info":
        return n.type === "info";
      case "reminder":
        return n.type === "reminder";
      default:
        return true;
    }
  });

  return {
    notifications: filtered,
    allNotifications: notifications,
    unreadCount,
    loading,
    filter,
    setFilter,
    markAsRead,
    markAllRead,
    refresh: fetchNotifications,
  };
}
