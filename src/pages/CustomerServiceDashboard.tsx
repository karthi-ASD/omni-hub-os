import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Headphones, MessageSquare, Clock, CheckCircle, AlertTriangle,
  TrendingUp, Users, Zap, BarChart3, ThumbsUp,
} from "lucide-react";

const stats = [
  { label: "Open Tickets", value: "47", icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-500/10" },
  { label: "Overdue", value: "8", icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
  { label: "Avg Response", value: "12m", icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
  { label: "Resolved Today", value: "23", icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { label: "CSAT Score", value: "94%", icon: ThumbsUp, color: "text-primary", bg: "bg-primary/10" },
  { label: "AI Handled", value: "61%", icon: Zap, color: "text-violet-500", bg: "bg-violet-500/10" },
];

const recentTickets = [
  { id: "T-1042", subject: "Payment gateway timeout", customer: "Acme Corp", priority: "high", status: "open", channel: "Email" },
  { id: "T-1041", subject: "Unable to login after reset", customer: "Jane Smith", priority: "medium", status: "in_progress", channel: "Chat" },
  { id: "T-1040", subject: "Feature request: export CSV", customer: "BlueWave Ltd", priority: "low", status: "pending", channel: "WhatsApp" },
  { id: "T-1039", subject: "Billing discrepancy Q1", customer: "TechStart Inc", priority: "high", status: "escalated", channel: "Phone" },
  { id: "T-1038", subject: "API rate limit exceeded", customer: "DevHouse", priority: "medium", status: "resolved", channel: "Email" },
];

const priorityColors: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  low: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
};

const statusColors: Record<string, string> = {
  open: "bg-blue-500/10 text-blue-600",
  in_progress: "bg-amber-500/10 text-amber-600",
  pending: "bg-muted text-muted-foreground",
  escalated: "bg-destructive/10 text-destructive",
  resolved: "bg-emerald-500/10 text-emerald-600",
};

const agentPerformance = [
  { name: "Sarah Mitchell", resolved: 18, avg: "8m", csat: "97%" },
  { name: "James Park", resolved: 14, avg: "15m", csat: "92%" },
  { name: "Priya Sharma", resolved: 12, avg: "11m", csat: "95%" },
];

const CustomerServiceDashboard = () => {
  usePageTitle("Customer Service Dashboard");

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Headphones className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Customer Service Hub</h1>
          <p className="text-xs text-muted-foreground">AI-powered support operations at a glance</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-3 flex items-center gap-3">
              <div className={`h-9 w-9 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground leading-none">{s.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Tickets */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Recent Tickets
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {recentTickets.map((t) => (
              <div key={t.id} className="px-4 py-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">{t.id}</span>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${priorityColors[t.priority]}`}>
                      {t.priority}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">{t.subject}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-muted-foreground">{t.customer}</span>
                    <span className="text-[10px] text-muted-foreground">• {t.channel}</span>
                  </div>
                </div>
                <Badge className={`text-[10px] ${statusColors[t.status]} border-0`}>
                  {t.status.replace("_", " ")}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Agent Performance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Top Agents Today
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {agentPerformance.map((a, i) => (
            <div key={a.name} className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{a.name}</p>
                <p className="text-[10px] text-muted-foreground">{a.resolved} resolved · {a.avg} avg</p>
              </div>
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                {a.csat} CSAT
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* AI Automation Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-violet-500" />
            AI Automation Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Auto-Categorized", value: "89%" },
              { label: "AI Reply Sent", value: "156" },
              { label: "Smart Routed", value: "74%" },
              { label: "Escalation Predicted", value: "12" },
            ].map((m) => (
              <div key={m.label} className="p-3 rounded-lg bg-secondary/50 border border-border/50">
                <p className="text-lg font-bold text-foreground">{m.value}</p>
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerServiceDashboard;
