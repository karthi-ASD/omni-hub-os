import { usePageTitle } from "@/hooks/usePageTitle";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Headphones, MessageSquare, Clock, CheckCircle, AlertTriangle,
  Zap, ThumbsUp, Users, ArrowRight,
  Brain, BookOpen, BarChart3, Ticket,
} from "lucide-react";
import { useCSTickets } from "@/hooks/useCSTickets";

const priorityColors: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  critical: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-success/10 text-success border-success/20",
};

const statusColors: Record<string, string> = {
  open: "bg-primary/10 text-primary",
  in_progress: "bg-warning/10 text-warning",
  pending: "bg-muted text-muted-foreground",
  escalated: "bg-destructive/10 text-destructive",
  resolved: "bg-success/10 text-success",
  closed: "bg-muted text-muted-foreground",
};

const CustomerServiceDashboard = () => {
  usePageTitle("Customer Service Dashboard");
  const navigate = useNavigate();
  const { isSuperAdmin, isBusinessAdmin } = useAuth();
  const { tickets, stats, loading } = useCSTickets();

  const isManager = isSuperAdmin || isBusinessAdmin;

  const channelBreakdown = tickets.reduce((acc: Record<string, number>, t: any) => {
    const ch = t.channel || "email";
    acc[ch] = (acc[ch] || 0) + 1;
    return acc;
  }, {});

  const priorityBreakdown = tickets.reduce((acc: Record<string, number>, t: any) => {
    acc[t.priority] = (acc[t.priority] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Customer Service Hub"
        subtitle={isManager ? "Manager view — AI-powered support operations" : "Support agent dashboard"}
        icon={Headphones}
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Open Tickets" value={stats.open} icon={MessageSquare} gradient="from-primary to-accent" loading={loading} />
        <StatCard label="Overdue" value={stats.overdue} icon={AlertTriangle} gradient="from-destructive to-red-500" alert={stats.overdue > 0} loading={loading} />
        <StatCard label="Avg Response" value={stats.avgResponseMin ? `${stats.avgResponseMin}m` : "—"} icon={Clock} gradient="from-warning to-orange-500" loading={loading} />
        <StatCard label="Resolved Today" value={stats.resolvedToday} icon={CheckCircle} gradient="from-success to-emerald-500" loading={loading} />
        <StatCard label="CSAT Score" value={stats.csatAvg ? `${stats.csatAvg}%` : "—"} icon={ThumbsUp} gradient="from-primary to-accent" loading={loading} />
        <StatCard label="AI Handled" value={stats.aiHandledPct ? `${stats.aiHandledPct}%` : "—"} icon={Zap} gradient="from-violet-500 to-purple-500" loading={loading} />
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Tickets", icon: Ticket, to: "/tickets" },
          { label: "Inbox", icon: MessageSquare, to: "/conversations" },
          { label: "KB", icon: BookOpen, to: "/knowledge-base" },
          { label: "Reports", icon: BarChart3, to: "/cs-reports" },
        ].map(q => (
          <Button key={q.to} variant="outline" size="sm" className="h-auto py-3 flex-col gap-1 rounded-xl" onClick={() => navigate(q.to)}>
            <q.icon className="h-4 w-4" />
            <span className="text-[10px]">{q.label}</span>
          </Button>
        ))}
      </div>

      {/* Manager-only: Channel & Priority breakdown */}
      {isManager && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="rounded-2xl border-0 shadow-elevated">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Channel Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(channelBreakdown).length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No data</p>
              ) : Object.entries(channelBreakdown)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([channel, count]) => (
                  <div key={channel} className="flex items-center gap-3">
                    <span className="text-xs font-medium w-20 capitalize">{channel}</span>
                    <Progress value={tickets.length > 0 ? ((count as number) / tickets.length) * 100 : 0} className="flex-1 h-2" />
                    <span className="text-[10px] text-muted-foreground w-10 text-right">{count as number}</span>
                  </div>
                ))}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-0 shadow-elevated">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Priority Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {["critical", "high", "medium", "low"].map(p => (
                <div key={p} className="flex items-center gap-3">
                  <Badge variant="outline" className={`text-[10px] w-16 justify-center ${priorityColors[p] || ""}`}>{p}</Badge>
                  <Progress value={tickets.length > 0 ? ((priorityBreakdown[p] || 0) / tickets.length) * 100 : 0} className="flex-1 h-2" />
                  <span className="text-[10px] text-muted-foreground w-8 text-right">{priorityBreakdown[p] || 0}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Tickets */}
      <Card className="rounded-2xl border-0 shadow-elevated">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Recent Tickets
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/tickets")}>
              View All <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No tickets yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {tickets.slice(0, 10).map((t: any) => (
                <div key={t.id} className="px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => navigate(`/ticket/${t.id}`)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-muted-foreground">{t.ticket_number}</span>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${priorityColors[t.priority] || ""}`}>
                        {t.priority}
                      </Badge>
                      {t.channel && <span className="text-[10px] text-muted-foreground">• {t.channel}</span>}
                      {t.sentiment && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0">
                          <Brain className="h-2.5 w-2.5 mr-0.5" />{t.sentiment}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium truncate">{t.subject}</p>
                    {t.ai_summary && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{t.ai_summary}</p>
                    )}
                  </div>
                  <Badge className={`text-[10px] ${statusColors[t.status] || ""} border-0 shrink-0`}>
                    {t.status?.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerServiceDashboard;
