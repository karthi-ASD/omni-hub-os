import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Globe, Key, TrendingUp, CheckCircle, AlertTriangle, MapPin, Calendar } from "lucide-react";
import type { SeoProject } from "@/hooks/useSeoProjects";
import type { SeoKeyword } from "@/hooks/useSeo";
import type { SeoOnpageTask } from "@/hooks/useSeo";

interface Props {
  project: SeoProject;
  keywords: SeoKeyword[];
  tasks: SeoOnpageTask[];
}

export function SeoProjectOverview({ project, keywords, tasks }: Props) {
  const activeKw = keywords.filter(k => k.status === "active").length;
  const top3 = keywords.filter(k => k.current_ranking !== null && k.current_ranking <= 3).length;
  const top10 = keywords.filter(k => k.current_ranking !== null && k.current_ranking <= 10).length;
  const improved = keywords.filter(k =>
    k.current_ranking !== null && k.previous_ranking !== null && k.current_ranking < k.previous_ranking
  ).length;
  const declined = keywords.filter(k =>
    k.current_ranking !== null && k.previous_ranking !== null && k.current_ranking > k.previous_ranking
  ).length;
  const pendingTasks = tasks.filter(t => t.status === "todo" || t.status === "in_progress").length;
  const completedTasks = tasks.filter(t => t.status === "done").length;

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Keywords" value={keywords.length} icon={Key} gradient="from-primary to-accent" />
        <StatCard label="Active" value={activeKw} icon={TrendingUp} gradient="from-success to-emerald-500" />
        <StatCard label="Top 3" value={top3} icon={TrendingUp} gradient="from-warning to-orange-500" />
        <StatCard label="Top 10" value={top10} icon={TrendingUp} gradient="from-info to-blue-500" />
        <StatCard label="Improved" value={improved} icon={TrendingUp} gradient="from-success to-teal-500" />
        <StatCard label="Declined" value={declined} icon={AlertTriangle} gradient="from-destructive to-red-500" alert={declined > 0} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project Details */}
        <Card className="rounded-2xl border-0 shadow-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Project Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow icon={Globe} label="Domain" value={project.website_domain} />
            <DetailRow icon={MapPin} label="Location" value={project.target_location || "Not set"} />
            <DetailRow icon={Key} label="Primary Keyword" value={project.primary_keyword || "Not set"} />
            <DetailRow icon={Calendar} label="Contract" value={
              project.contract_start
                ? `${project.contract_start} → ${project.contract_end || "Ongoing"}`
                : "Not set"
            } />
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-muted-foreground w-24">Status</span>
              <Badge variant="secondary" className="capitalize">{project.project_status}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-24">Package</span>
              <Badge variant="outline" className="capitalize">{project.service_package}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Task Summary */}
        <Card className="rounded-2xl border-0 shadow-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Task Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-warning/10">
                <p className="text-2xl font-bold text-warning">{pendingTasks}</p>
                <p className="text-xs text-muted-foreground mt-1">Pending Tasks</p>
              </div>
              <div className="p-4 rounded-xl bg-success/10">
                <p className="text-2xl font-bold text-success">{completedTasks}</p>
                <p className="text-xs text-muted-foreground mt-1">Completed</p>
              </div>
            </div>
            {tasks.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Completion</span>
                  <span>{tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-success transition-all duration-700"
                    style={{ width: `${tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}

            {/* Ranking Movement Summary */}
            <div className="pt-2 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Keyword Movement</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-success">{improved}</p>
                  <p className="text-[10px] text-muted-foreground">Improved</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-destructive">{declined}</p>
                  <p className="text-[10px] text-muted-foreground">Declined</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-muted-foreground">{keywords.length - improved - declined}</p>
                  <p className="text-[10px] text-muted-foreground">Unchanged</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className="text-xs text-muted-foreground w-24 shrink-0">{label}</span>
      <span className="text-sm font-medium truncate">{value}</span>
    </div>
  );
}
