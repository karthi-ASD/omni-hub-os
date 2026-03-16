import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SeoOverviewStats } from "@/hooks/useSeoOverviewStats";

interface Props {
  stats: SeoOverviewStats;
}

const statusColors: Record<string, string> = {
  active: "bg-success",
  onboarding: "bg-warning",
  paused: "bg-muted-foreground",
  completed: "bg-primary",
  cancelled: "bg-destructive",
};

const packageColors: Record<string, string> = {
  basic: "bg-muted-foreground",
  standard: "bg-info",
  premium: "bg-primary",
  enterprise: "bg-warning",
};

export function SeoOverviewCharts({ stats }: Props) {
  const totalForBar = stats.totalProjects || 1;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Project Status Distribution */}
      <Card className="rounded-2xl border-0 shadow-elevated">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Project Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats.projectsByStatus.map(({ status, count }) => (
            <div key={status} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium capitalize">{status}</span>
                <span className="text-sm text-muted-foreground font-mono">{count}</span>
              </div>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-700", statusColors[status] || "bg-primary")}
                  style={{ width: `${(count / totalForBar) * 100}%` }}
                />
              </div>
            </div>
          ))}
          {stats.projectsByStatus.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No projects yet</p>
          )}
        </CardContent>
      </Card>

      {/* Package Distribution */}
      <Card className="rounded-2xl border-0 shadow-elevated">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Service Packages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {stats.projectsByPackage.map(({ package: pkg, count }) => (
              <div key={pkg} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <div className={cn("h-3 w-3 rounded-full", packageColors[pkg] || "bg-primary")} />
                <div>
                  <p className="text-sm font-semibold capitalize">{pkg}</p>
                  <p className="text-xs text-muted-foreground">{count} project{count !== 1 ? "s" : ""}</p>
                </div>
              </div>
            ))}
          </div>
          {stats.projectsByPackage.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No projects yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
