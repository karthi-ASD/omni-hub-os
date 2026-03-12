import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarCheck, Phone, Mail, MessageSquare, Users } from "lucide-react";
import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";

const typeIcons: Record<string, React.ElementType> = {
  call: Phone,
  email: Mail,
  whatsapp: MessageSquare,
  meeting: Users,
};

const SalesFollowUpsPage = () => {
  const { profile } = useAuth();
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("today");

  const fetchFollowUps = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("cold_calls")
      .select("*")
      .eq("business_id", profile.business_id)
      .not("follow_up_date", "is", null)
      .order("follow_up_date", { ascending: true })
      .limit(500);
    setFollowUps(data || []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetchFollowUps(); }, [fetchFollowUps]);

  const todayItems = followUps.filter(f => f.follow_up_date && isToday(parseISO(f.follow_up_date)));
  const tomorrowItems = followUps.filter(f => f.follow_up_date && isTomorrow(parseISO(f.follow_up_date)));
  const overdueItems = followUps.filter(f => f.follow_up_date && isPast(parseISO(f.follow_up_date)) && !isToday(parseISO(f.follow_up_date)));
  const upcomingItems = followUps.filter(f => f.follow_up_date && !isPast(parseISO(f.follow_up_date)) && !isToday(parseISO(f.follow_up_date)) && !isTomorrow(parseISO(f.follow_up_date)));

  const displayItems = tab === "today" ? todayItems : tab === "tomorrow" ? tomorrowItems : tab === "overdue" ? overdueItems : upcomingItems;

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
          const Icon = typeIcons[item.follow_up_type] || Phone;
          return (
            <Card key={item.id} className="rounded-2xl border-0 shadow-elevated">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{item.business_name}</p>
                  {item.contact_person && <p className="text-xs text-muted-foreground">{item.contact_person}</p>}
                  {item.phone && <p className="text-xs text-muted-foreground">{item.phone}</p>}
                </div>
                <div className="text-right shrink-0">
                  <Badge variant="outline" className="text-xs">
                    {item.follow_up_date && format(parseISO(item.follow_up_date), "dd MMM")}
                  </Badge>
                  {item.follow_up_time && (
                    <p className="text-xs text-muted-foreground mt-1">{item.follow_up_time}</p>
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
