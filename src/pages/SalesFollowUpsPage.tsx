import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEmployeeDepartment } from "@/hooks/useEmployeeDepartment";
import { useSalesDataAutoRefresh } from "@/lib/salesDataSync";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarCheck, Phone, Mail, MessageSquare, Users, AlertTriangle } from "lucide-react";
import { format, isToday, isTomorrow, isPast, parseISO, startOfDay } from "date-fns";

const SalesFollowUpsPage = () => {
  const { profile, roles } = useAuth();
  const { departmentName } = useEmployeeDepartment();
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("today");

  // Determine if user is admin or sales-only
  const isAdmin = useMemo(() => {
    const adminRoles = ["super_admin", "business_admin", "hr_manager", "manager"];
    return roles.some(r => adminRoles.includes(r));
  }, [roles]);

  const fetchFollowUps = useCallback(async () => {
    if (!profile?.business_id) return;

    // Query leads that have a next_follow_up_at set
    let query = supabase
      .from("leads")
      .select("id, name, email, phone, business_name, next_follow_up_at, stage, assigned_to_user_id, lead_temperature, last_contact_method")
      .eq("business_id", profile.business_id)
      .eq("is_deleted", false)
      .not("next_follow_up_at", "is", null)
      .order("next_follow_up_at", { ascending: true });

    // Filter by salesperson if not admin
    if (!isAdmin && profile.user_id) {
      query = query.eq("assigned_to_user_id", profile.user_id);
    }

    const { data, error } = await query.limit(500);
    if (error) console.error("Follow-ups fetch error:", error);
    setFollowUps(data || []);
    setLoading(false);
  }, [profile?.business_id, profile?.user_id, isAdmin]);

  useEffect(() => { fetchFollowUps(); }, [fetchFollowUps]);
  useSalesDataAutoRefresh(fetchFollowUps, ["all", "follow-ups", "leads", "dashboard"]);

  const todayItems = followUps.filter(f => {
    if (!f.next_follow_up_at) return false;
    const d = parseISO(f.next_follow_up_at);
    return isToday(d);
  });

  const tomorrowItems = followUps.filter(f => {
    if (!f.next_follow_up_at) return false;
    const d = parseISO(f.next_follow_up_at);
    return isTomorrow(d);
  });

  const overdueItems = followUps.filter(f => {
    if (!f.next_follow_up_at) return false;
    const d = parseISO(f.next_follow_up_at);
    return isPast(startOfDay(d)) && !isToday(d);
  });

  const upcomingItems = followUps.filter(f => {
    if (!f.next_follow_up_at) return false;
    const d = parseISO(f.next_follow_up_at);
    return !isPast(d) && !isToday(d) && !isTomorrow(d);
  });

  const displayItems = tab === "today" ? todayItems : tab === "tomorrow" ? tomorrowItems : tab === "overdue" ? overdueItems : upcomingItems;

  const getContactIcon = (method: string | null) => {
    if (method === "email") return Mail;
    if (method === "whatsapp") return MessageSquare;
    if (method === "meeting") return Users;
    return Phone;
  };

  const renderList = (items: any[]) => {
    if (loading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>;
    if (items.length === 0) return (
      <Card className="rounded-2xl border-0 shadow-elevated">
        <CardContent className="py-12 text-center text-muted-foreground">No follow-ups</CardContent>
      </Card>
    );
    return (
      <div className="space-y-2">
        {items.map((item: any) => {
          const Icon = getContactIcon(item.last_contact_method);
          const followUpDate = parseISO(item.next_follow_up_at);
          const isOverdue = isPast(startOfDay(followUpDate)) && !isToday(followUpDate);
          return (
            <Card key={item.id} className={`rounded-2xl border-0 shadow-elevated ${isOverdue ? "border-l-4 border-l-destructive" : ""}`}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${isOverdue ? "bg-destructive/10" : "bg-primary/10"}`}>
                  {isOverdue ? <AlertTriangle className="h-5 w-5 text-destructive" /> : <Icon className="h-5 w-5 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{item.name}</p>
                  {item.business_name && <p className="text-xs text-muted-foreground">{item.business_name}</p>}
                  {item.phone && <p className="text-xs text-muted-foreground">{item.phone}</p>}
                </div>
                <div className="text-right shrink-0">
                  <Badge variant={isOverdue ? "destructive" : "outline"} className="text-xs">
                    {format(followUpDate, "dd MMM")}
                  </Badge>
                  {item.lead_temperature && (
                    <p className="text-xs text-muted-foreground mt-1 capitalize">{item.lead_temperature}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Follow-Ups"
        subtitle={`${todayItems.length} today · ${overdueItems.length} overdue`}
        icon={CalendarCheck}
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="today">Today ({todayItems.length})</TabsTrigger>
          <TabsTrigger value="tomorrow">Tomorrow ({tomorrowItems.length})</TabsTrigger>
          <TabsTrigger value="overdue" className={overdueItems.length > 0 ? "text-destructive" : ""}>
            Overdue ({overdueItems.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({upcomingItems.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {renderList(displayItems)}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SalesFollowUpsPage;
