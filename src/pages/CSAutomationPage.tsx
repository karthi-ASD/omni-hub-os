import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Zap, ArrowRight, Mail, MessageSquare, Clock, AlertTriangle, ThumbsUp, Bot } from "lucide-react";

const automations = [
  { name: "Auto-Create Ticket from Email", description: "Automatically create support tickets from incoming emails", trigger: "New Email", action: "Create Ticket", enabled: true, runs: 342 },
  { name: "Auto-Assign by Department", description: "Route tickets to the correct department based on AI categorization", trigger: "Ticket Created", action: "Assign Agent", enabled: true, runs: 298 },
  { name: "SLA Breach Escalation", description: "Escalate ticket when response SLA is about to breach", trigger: "SLA Warning", action: "Escalate + Notify", enabled: true, runs: 45 },
  { name: "Auto Follow-up (No Reply)", description: "Send follow-up if customer doesn't reply within 48 hours", trigger: "No Reply 48h", action: "Send Follow-up", enabled: true, runs: 167 },
  { name: "CSAT Survey on Close", description: "Send satisfaction survey when ticket is resolved", trigger: "Ticket Resolved", action: "Send Survey", enabled: false, runs: 89 },
  { name: "AI Summary for Managers", description: "Generate daily AI summaries of all ticket activity", trigger: "Daily 9am", action: "Generate Report", enabled: true, runs: 30 },
  { name: "AI First Response", description: "AI chatbot provides first-level support before human handoff", trigger: "New Chat", action: "AI Response", enabled: true, runs: 512 },
];

const CSAutomationPage = () => {
  usePageTitle("CS Automation Rules");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
          <Zap className="h-5 w-5 text-violet-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Automation Rules</h1>
          <p className="text-xs text-muted-foreground">Automate customer service workflows with AI</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-foreground">{automations.length}</p>
            <p className="text-[10px] text-muted-foreground">Total Rules</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-emerald-600">{automations.filter(a => a.enabled).length}</p>
            <p className="text-[10px] text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-primary">{automations.reduce((s, a) => s + a.runs, 0)}</p>
            <p className="text-[10px] text-muted-foreground">Total Runs</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {automations.map((a) => (
          <Card key={a.name} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{a.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{a.description}</p>
                </div>
                <Switch checked={a.enabled} />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">{a.trigger}</Badge>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">{a.action}</Badge>
                <span className="ml-auto text-[10px] text-muted-foreground">{a.runs} runs</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CSAutomationPage;
