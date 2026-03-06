import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Bot, Zap, MessageSquare, Brain, ShieldCheck, Settings, Sparkles } from "lucide-react";

const aiFeatures = [
  { name: "AI Reply Suggestions", description: "Generate contextual reply suggestions for agents", icon: MessageSquare, enabled: true, category: "Agent Assist" },
  { name: "Ticket Auto-Categorization", description: "Automatically categorize and tag incoming tickets", icon: Zap, enabled: true, category: "Automation" },
  { name: "Sentiment Analysis", description: "Detect customer sentiment in real-time", icon: Brain, enabled: true, category: "Intelligence" },
  { name: "Priority Detection", description: "AI-powered priority assignment based on content analysis", icon: Sparkles, enabled: true, category: "Automation" },
  { name: "Smart Routing", description: "Route tickets to the best available agent or department", icon: Zap, enabled: true, category: "Automation" },
  { name: "Ticket Summary Generation", description: "Auto-generate summaries for long ticket threads", icon: MessageSquare, enabled: false, category: "Agent Assist" },
  { name: "Customer Intent Detection", description: "Detect customer intent and suggest next best action", icon: Brain, enabled: true, category: "Intelligence" },
  { name: "Escalation Prediction", description: "Predict which tickets are likely to escalate", icon: ShieldCheck, enabled: false, category: "Intelligence" },
  { name: "AI Chatbot (First Level)", description: "AI-powered first response chatbot for common queries", icon: Bot, enabled: true, category: "Self-Service" },
  { name: "Knowledge Base Recommendations", description: "Suggest relevant KB articles to agents and customers", icon: Sparkles, enabled: true, category: "Self-Service" },
];

const AIAssistantSettingsPage = () => {
  usePageTitle("AI Assistant Settings");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
          <Bot className="h-5 w-5 text-violet-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">AI Assistant Settings</h1>
          <p className="text-xs text-muted-foreground">Configure AI-powered customer service features</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-emerald-600">{aiFeatures.filter(f => f.enabled).length}</p>
            <p className="text-[10px] text-muted-foreground">Active Features</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-muted-foreground">{aiFeatures.filter(f => !f.enabled).length}</p>
            <p className="text-[10px] text-muted-foreground">Disabled</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {aiFeatures.map((f) => (
          <Card key={f.name} className="border-border/50">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <f.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-medium text-foreground">{f.name}</p>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0">{f.category}</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">{f.description}</p>
              </div>
              <Switch checked={f.enabled} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AIAssistantSettingsPage;
