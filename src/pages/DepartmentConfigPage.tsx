import { useDepartmentTemplates, useBusinessDeptConfig } from "@/hooks/useBusinessOnboarding";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2 } from "lucide-react";

export default function DepartmentConfigPage() {
  const { templates, loading: templatesLoading } = useDepartmentTemplates();
  const { configs, loading: configLoading, toggleDepartment } = useBusinessDeptConfig();

  const isEnabled = (templateId: string) => {
    const cfg = configs.find((c: any) => c.department_template_id === templateId);
    return cfg ? cfg.is_enabled : false;
  };

  const loading = templatesLoading || configLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Department Configuration"
        subtitle="Enable or disable departments for your business. Each department comes with pre-configured fields and workflows."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Department Library
          </CardTitle>
          <CardDescription>Toggle departments to activate them for your workspace</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {templates.map((t) => {
                const enabled = isEnabled(t.id);
                const fieldCount = Array.isArray(t.default_fields) ? t.default_fields.length : 0;
                return (
                  <div key={t.id} className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{t.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.description || "No description"} • {fieldCount} default fields
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={enabled ? "default" : "secondary"}>
                        {enabled ? "Active" : "Disabled"}
                      </Badge>
                      <Switch
                        checked={enabled}
                        onCheckedChange={(checked) => toggleDepartment(t.id, checked)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
