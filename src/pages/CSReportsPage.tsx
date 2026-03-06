import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Clock, Users, ThumbsUp, MessageSquare, Zap, ArrowUp, ArrowDown } from "lucide-react";

const metrics = [
  { label: "Total Tickets", value: "1,247", change: "+12%", up: true },
  { label: "Avg Resolution Time", value: "4.2h", change: "-18%", up: false },
  { label: "First Response Time", value: "8m", change: "-25%", up: false },
  { label: "CSAT Score", value: "94.2%", change: "+3.1%", up: true },
  { label: "AI Resolution Rate", value: "61%", change: "+8%", up: true },
  { label: "Escalation Rate", value: "7.3%", change: "-2.1%", up: false },
];

const channelBreakdown = [
  { channel: "Email", tickets: 423, pct: "34%" },
  { channel: "Live Chat", tickets: 312, pct: "25%" },
  { channel: "WhatsApp", tickets: 248, pct: "20%" },
  { channel: "Phone", tickets: 156, pct: "13%" },
  { channel: "Mobile App", tickets: 108, pct: "8%" },
];

const CSReportsPage = () => {
  usePageTitle("CS Reports & Analytics");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">CS Reports & Analytics</h1>
          <p className="text-xs text-muted-foreground">Customer service performance metrics and trends</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {metrics.map((m) => (
          <Card key={m.label} className="border-border/50">
            <CardContent className="p-3">
              <p className="text-[10px] text-muted-foreground mb-1">{m.label}</p>
              <div className="flex items-end gap-2">
                <p className="text-lg font-bold text-foreground">{m.value}</p>
                <span className={`text-[10px] font-medium flex items-center gap-0.5 ${m.up ? (m.label.includes("Escalation") ? "text-destructive" : "text-emerald-600") : (m.label.includes("Resolution") || m.label.includes("Response") ? "text-emerald-600" : "text-destructive")}`}>
                  {m.up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  {m.change}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Channel Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {channelBreakdown.map((c) => (
            <div key={c.channel} className="flex items-center gap-3">
              <span className="text-sm font-medium text-foreground w-24">{c.channel}</span>
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: c.pct }} />
              </div>
              <span className="text-xs text-muted-foreground w-16 text-right">{c.tickets} ({c.pct})</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default CSReportsPage;
