import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { useState } from "react";

interface QAItem {
  id: string;
  label: string;
  description: string;
  status: "PASS" | "FAIL" | "UNTESTED";
  ownerAction?: string;
}

const INITIAL_ITEMS: QAItem[] = [
  { id: "auth", label: "Auth & SSO", description: "Email/password login, Google OAuth, session management", status: "UNTESTED" },
  { id: "tenant", label: "Tenant Isolation", description: "RLS policies enforce business_id isolation on all tables", status: "UNTESTED" },
  { id: "rbac", label: "RBAC", description: "Role-based access for super_admin, business_admin, manager, employee, client", status: "UNTESTED" },
  { id: "billing", label: "Billing Separation", description: "Platform billing (NextWeb→tenants) vs Tenant billing (tenant→customers)", status: "UNTESTED" },
  { id: "automations", label: "Automations", description: "Reminders, notifications, AI tasks, background jobs", status: "UNTESTED" },
  { id: "seo_geo", label: "SEO + GEO", description: "SEO campaigns, GEO entity graph, schema manager, answer blocks", status: "UNTESTED" },
  { id: "analytics", label: "Analytics Dashboards", description: "Business analytics, daily metrics, GA4/GSC/GBP connections", status: "UNTESTED" },
  { id: "ai", label: "AI Agent Safety", description: "Approval workflows, autonomy levels, action logging", status: "UNTESTED" },
  { id: "marketplace", label: "Marketplace & Plugins", description: "Plugin install/uninstall, permission enforcement", status: "UNTESTED" },
  { id: "app_factory", label: "App Factory & Publishing", description: "White-label builds, store status tracking", status: "UNTESTED" },
  { id: "investor", label: "Investor Tools", description: "Pitch deck, valuation, data room, fundraising rounds", status: "UNTESTED" },
  { id: "partner", label: "Partner Portal", description: "Partner registration, commissions, referral tracking", status: "UNTESTED" },
  { id: "backups", label: "Backups & DR", description: "Backup jobs, runs, restore simulation", status: "UNTESTED" },
  { id: "observability", label: "Observability & Alerts", description: "Health checks, job logs, alert rules", status: "UNTESTED" },
  { id: "performance", label: "Performance Baseline", description: "Load test plan, caching strategy, query optimization", status: "UNTESTED" },
];

const QAChecklistPage = () => {
  const [items, setItems] = useState<QAItem[]>(INITIAL_ITEMS);

  const setStatus = (id: string, status: "PASS" | "FAIL" | "UNTESTED") => {
    setItems(items.map(i => i.id === id ? { ...i, status } : i));
  };

  const passed = items.filter(i => i.status === "PASS").length;
  const failed = items.filter(i => i.status === "FAIL").length;
  const untested = items.filter(i => i.status === "UNTESTED").length;
  const isGoLive = failed === 0 && untested === 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">QA Master Checklist</h1>
          <p className="text-muted-foreground">Stage 1–15 final certification</p>
        </div>
        <Badge variant={isGoLive ? "default" : "destructive"} className="text-sm px-3 py-1">
          {isGoLive ? "✅ GO" : `NO-GO (${failed} failed, ${untested} untested)`}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-green-500">{passed}</p><p className="text-xs text-muted-foreground">Passed</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-destructive">{failed}</p><p className="text-xs text-muted-foreground">Failed</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-muted-foreground">{untested}</p><p className="text-xs text-muted-foreground">Untested</p></CardContent></Card>
      </div>

      <div className="space-y-3">
        {items.map((item, idx) => (
          <Card key={item.id}>
            <CardContent className="pt-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-muted-foreground w-6">{idx + 1}</span>
                {item.status === "PASS" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : item.status === "FAIL" ? (
                  <XCircle className="h-5 w-5 text-destructive" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                )}
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant={item.status === "PASS" ? "default" : "outline"} onClick={() => setStatus(item.id, "PASS")}>Pass</Button>
                <Button size="sm" variant={item.status === "FAIL" ? "destructive" : "outline"} onClick={() => setStatus(item.id, "FAIL")}>Fail</Button>
                <Button size="sm" variant="ghost" onClick={() => setStatus(item.id, "UNTESTED")}><RotateCcw className="h-3 w-3" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default QAChecklistPage;
