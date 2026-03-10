import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSeoProjects } from "@/hooks/useSeoProjects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ListChecks, AlertTriangle, FileText, MapPin, TrendingUp, BarChart3 } from "lucide-react";

interface DashboardStats {
  tasksDueToday: number;
  tasksOverdue: number;
  blogsScheduled: number;
  gmbScheduled: number;
  totalActive: number;
}

const SeoTeamDashboardPage = () => {
  const { projects, loading: projLoading } = useSeoProjects();
  const [stats, setStats] = useState<DashboardStats>({ tasksDueToday: 0, tasksOverdue: 0, blogsScheduled: 0, gmbScheduled: 0, totalActive: 0 });
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const today = new Date().toISOString().slice(0, 10);

      const [{ data: dueToday }, { data: overdue }, { data: blogs }, { data: gmb }, { data: recent }] = await Promise.all([
        supabase.from("seo_tasks").select("id").eq("deadline", today).neq("status", "COMPLETED") as any,
        supabase.from("seo_tasks").select("id").lt("deadline", today).neq("status", "COMPLETED") as any,
        supabase.from("seo_blogs").select("id").eq("status", "DRAFT") as any,
        supabase.from("gmb_tasks").select("id").in("status", ["DRAFT", "SCHEDULED"]) as any,
        supabase.from("seo_tasks").select("*").order("updated_at", { ascending: false }).limit(10) as any,
      ]);

      setStats({
        tasksDueToday: dueToday?.length || 0,
        tasksOverdue: overdue?.length || 0,
        blogsScheduled: blogs?.length || 0,
        gmbScheduled: gmb?.length || 0,
        totalActive: projects.filter(p => p.project_status === "ACTIVE").length,
      });
      setRecentTasks(recent || []);
      setLoading(false);
    };
    if (!projLoading) fetchStats();
  }, [projects, projLoading]);

  if (loading || projLoading) return <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-48 w-full" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">SEO Team Dashboard</h1>
        <p className="text-muted-foreground">Today's overview and pending work</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Active Projects</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{stats.totalActive}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><ListChecks className="h-3 w-3" />Due Today</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-primary">{stats.tasksDueToday}</p></CardContent></Card>
        <Card className={stats.tasksOverdue > 0 ? "border-destructive" : ""}><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Overdue</CardTitle></CardHeader><CardContent><p className={`text-2xl font-bold ${stats.tasksOverdue > 0 ? "text-destructive" : ""}`}>{stats.tasksOverdue}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><FileText className="h-3 w-3" />Blogs Pending</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{stats.blogsScheduled}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />GMB Scheduled</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{stats.gmbScheduled}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" />SEO Score</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">—</p></CardContent></Card>
      </div>

      {/* Recent Tasks */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Recent Task Activity</CardTitle></CardHeader>
        <CardContent>
          {recentTasks.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No task activity yet</p>
          ) : (
            <div className="space-y-3">
              {recentTasks.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{t.task_title}</p>
                    <p className="text-xs text-muted-foreground">{t.task_category?.replace(/_/g, " ")} · {t.deadline || "No deadline"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={t.progress_percent || 0} className="w-16 h-2" />
                    <Badge variant="secondary" className="text-xs">{t.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SeoTeamDashboardPage;
