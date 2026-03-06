import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Globe, Phone, Mail, Star } from "lucide-react";

const companies = [
  { name: "Acme Corporation", industry: "Technology", contacts: 12, tickets: 34, plan: "Enterprise", status: "active", health: "good" },
  { name: "BlueWave Ltd", industry: "Finance", contacts: 6, tickets: 18, plan: "Professional", status: "active", health: "at_risk" },
  { name: "TechStart Inc", industry: "SaaS", contacts: 4, tickets: 8, plan: "Starter", status: "active", health: "good" },
  { name: "GreenLeaf Co", industry: "Retail", contacts: 3, tickets: 22, plan: "Professional", status: "churned", health: "critical" },
  { name: "DevHouse Studio", industry: "Agency", contacts: 8, tickets: 15, plan: "Enterprise", status: "active", health: "good" },
];

const healthColors: Record<string, string> = {
  good: "bg-emerald-500/10 text-emerald-600",
  at_risk: "bg-amber-500/10 text-amber-600",
  critical: "bg-destructive/10 text-destructive",
};

const CompanyAccountsPage = () => {
  usePageTitle("Company Accounts");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Company Accounts</h1>
          <p className="text-xs text-muted-foreground">Manage B2B customer accounts and relationships</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-foreground">{companies.length}</p>
            <p className="text-[10px] text-muted-foreground">Total Accounts</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-emerald-600">{companies.filter(c => c.status === "active").length}</p>
            <p className="text-[10px] text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-destructive">{companies.filter(c => c.health === "critical").length}</p>
            <p className="text-[10px] text-muted-foreground">Critical</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {companies.map((c) => (
          <Card key={c.name} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">{c.name}</p>
                  <p className="text-[11px] text-muted-foreground">{c.industry} · {c.plan}</p>
                </div>
                <Badge className={`text-[10px] ${healthColors[c.health]} border-0`}>
                  {c.health.replace("_", " ")}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {c.contacts} contacts</span>
                <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {c.tickets} tickets</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CompanyAccountsPage;
