import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle, AlertTriangle, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Dependency {
  id: string;
  category: string;
  provider: string;
  label: string;
  scope_level: string;
  is_required: boolean;
  status: string;
  credential_type: string | null;
  notes: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  auth: "Authentication", email: "Email", payments: "Payments",
  accounting: "Accounting", comms: "Communications", analytics: "Analytics",
  ads: "Advertising", voice: "Voice / Call", app_publishing: "App Publishing",
  storage: "Storage", monitoring: "Monitoring",
};

const DependenciesWizardPage = () => {
  const [deps, setDeps] = useState<Dependency[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("dependency_registry").select("*").order("category").then(({ data }) => {
      setDeps((data as any) || []);
      setLoading(false);
    });
  }, []);

  const markStatus = async (id: string, status: string) => {
    await supabase.from("dependency_registry").update({ status } as any).eq("id", id);
    setDeps(deps.map(d => d.id === id ? { ...d, status } : d));
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>;

  const categories = [...new Set(deps.map(d => d.category))];
  const requiredMissing = deps.filter(d => d.is_required && d.status === "missing");
  const isReady = requiredMissing.length === 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dependencies Wizard</h1>
          <p className="text-muted-foreground">Track all API credentials and integrations</p>
        </div>
        <Badge variant={isReady ? "default" : "destructive"} className="text-sm px-3 py-1">
          {isReady ? "✅ Ready for Production" : `❌ ${requiredMissing.length} required missing`}
        </Badge>
      </div>

      {categories.map(cat => (
        <Card key={cat}>
          <CardHeader><CardTitle className="text-base">{CATEGORY_LABELS[cat] || cat}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {deps.filter(d => d.category === cat).map(dep => (
              <div key={dep.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {dep.status === "configured" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : dep.is_required ? (
                    <XCircle className="h-5 w-5 text-destructive" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{dep.label}</p>
                    <p className="text-xs text-muted-foreground">{dep.credential_type} · {dep.scope_level}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {dep.is_required && <Badge variant="outline" className="text-xs">Required</Badge>}
                  <Badge variant={dep.status === "configured" ? "default" : "secondary"}>{dep.status}</Badge>
                  {dep.status === "missing" && (
                    <Button size="sm" variant="outline" onClick={() => markStatus(dep.id, "configured")}>
                      Mark Configured
                    </Button>
                  )}
                  {dep.status === "configured" && (
                    <Button size="sm" variant="ghost" onClick={() => markStatus(dep.id, "missing")}>
                      Reset
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DependenciesWizardPage;
