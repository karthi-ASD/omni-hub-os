import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useCSTickets } from "@/hooks/useCSTickets";
import { useAuth } from "@/contexts/AuthContext";
import { useTicketAI } from "@/hooks/useTicketAI";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Ticket, User, Clock, CheckCircle, AlertTriangle, Brain,
  MessageSquare, Phone, ArrowRight, Sparkles, Headphones,
} from "lucide-react";
import { format } from "date-fns";

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/10 text-primary",
  high: "bg-warning/10 text-warning",
  critical: "bg-destructive/10 text-destructive",
};

const StaffMobileAppPage = () => {
  usePageTitle("Staff Dashboard");
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { tickets, stats, loading } = useCSTickets();

  // Simulate assigned tickets (filter by assigned_to_user_id)
  const myTickets = tickets.filter((t: any) =>
    t.assigned_to_user_id === profile?.user_id ||
    t.status === "open" || t.status === "in_progress"
  );
  const urgent = myTickets.filter((t: any) => t.priority === "critical" || t.priority === "high");

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Headphones className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Staff Dashboard</h1>
          <p className="text-xs text-muted-foreground">Your assigned tickets and quick actions</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Open", value: stats.open, color: "text-primary", icon: Ticket },
          { label: "Urgent", value: urgent.length, color: "text-destructive", icon: AlertTriangle },
          { label: "Resolved", value: stats.resolvedToday, color: "text-success", icon: CheckCircle },
          { label: "Overdue", value: stats.overdue, color: "text-warning", icon: Clock },
        ].map(s => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-2 text-center">
              <s.icon className={`h-4 w-4 mx-auto ${s.color}`} />
              <p className="text-lg font-bold text-foreground">{s.value}</p>
              <p className="text-[9px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2">
        <Button variant="outline" size="sm" className="h-auto py-3 flex-col gap-1" onClick={() => navigate("/tickets")}>
          <Ticket className="h-4 w-4" />
          <span className="text-[10px]">All Tickets</span>
        </Button>
        <Button variant="outline" size="sm" className="h-auto py-3 flex-col gap-1" onClick={() => navigate("/conversations")}>
          <MessageSquare className="h-4 w-4" />
          <span className="text-[10px]">Conversations</span>
        </Button>
        <Button variant="outline" size="sm" className="h-auto py-3 flex-col gap-1" onClick={() => navigate("/knowledge-base")}>
          <Brain className="h-4 w-4" />
          <span className="text-[10px]">KB</span>
        </Button>
      </div>

      <Tabs defaultValue="assigned">
        <TabsList className="w-full grid grid-cols-3 h-8">
          <TabsTrigger value="assigned" className="text-[10px]">My Tickets</TabsTrigger>
          <TabsTrigger value="urgent" className="text-[10px]">Urgent</TabsTrigger>
          <TabsTrigger value="recent" className="text-[10px]">Recent</TabsTrigger>
        </TabsList>

        {[
          { key: "assigned", data: myTickets.slice(0, 20) },
          { key: "urgent", data: urgent },
          { key: "recent", data: tickets.slice(0, 15) },
        ].map(tab => (
          <TabsContent key={tab.key} value={tab.key} className="mt-3">
            {loading ? (
              <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : tab.data.length === 0 ? (
              <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">No tickets</CardContent></Card>
            ) : (
              <div className="space-y-2">
                {tab.data.map((t: any) => (
                  <Card key={t.id} className="border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/ticket/${t.id}`)}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[10px] font-mono text-muted-foreground">{t.ticket_number}</span>
                            <Badge variant="outline" className={`text-[9px] px-1 py-0 ${priorityColors[t.priority]}`}>{t.priority}</Badge>
                          </div>
                          <p className="text-xs font-medium text-foreground truncate">{t.subject}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {format(new Date(t.created_at), "MMM d, h:mm a")}
                            {t.channel && ` · ${t.channel}`}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default StaffMobileAppPage;
