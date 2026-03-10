import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSeoProjects } from "@/hooks/useSeoProjects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ListChecks, AlertTriangle, FileText, MapPin, TrendingUp, TrendingDown, Link2, BarChart3, Target, Mail, Search, Map as MapIcon } from "lucide-react";

interface DashboardStats {
  tasksDueToday: number;
  tasksOverdue: number;
  blogsScheduled: number;
  gmbScheduled: number;
  totalActive: number;
  newBacklinks: number;
  lostBacklinks: number;
  lowScorePages: number;
  gapOpportunities: number;
  outreachPending: number;
  outreachReplied: number;
  linksAcquired: number;
  pendingInternalLinks: number;
  pagesAudited: number;
  criticalIssues: number;
  contentPendingApproval: number;
  activeRoadmaps: number;
}

const SeoTeamDashboardPage = () => {
  const { projects, loading: projLoading } = useSeoProjects();
  const [stats, setStats] = useState<DashboardStats>({
    tasksDueToday: 0, tasksOverdue: 0, blogsScheduled: 0, gmbScheduled: 0,
    totalActive: 0, newBacklinks: 0, lostBacklinks: 0, lowScorePages: 0, gapOpportunities: 0,
    outreachPending: 0, outreachReplied: 0, linksAcquired: 0, pendingInternalLinks: 0,
    pagesAudited: 0, criticalIssues: 0, contentPendingApproval: 0, activeRoadmaps: 0,
  });
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const today = new Date().toISOString().slice(0, 10);

      const [
        { data: dueToday }, { data: overdue }, { data: blogs }, { data: gmb }, { data: recent },
        { data: newBl }, { data: lostBl }, { data: lowPages }, { data: highGaps },
        { data: outPending }, { data: outReplied }, { data: linksAcq },
        { data: pendLinks }, { data: audited }, { data: contentPend }, { data: roadmaps },
      ] = await Promise.all([
        supabase.from("seo_tasks").select("id").eq("deadline", today).neq("status", "COMPLETED") as any,
        supabase.from("seo_tasks").select("id").lt("deadline", today).neq("status", "COMPLETED") as any,
        supabase.from("seo_blogs").select("id").eq("status", "DRAFT") as any,
        supabase.from("gmb_tasks").select("id").in("status", ["DRAFT", "SCHEDULED"]) as any,
        supabase.from("seo_tasks").select("*").order("updated_at", { ascending: false }).limit(10) as any,
        (supabase.from("seo_backlinks") as any).select("id").eq("status", "NEW"),
        (supabase.from("seo_backlinks") as any).select("id").eq("status", "LOST"),
        (supabase.from("seo_page_scores") as any).select("id").lt("seo_score", 60),
        (supabase.from("seo_competitor_gap") as any).select("id").gte("opportunity_score", 70),
        (supabase.from("seo_backlink_outreach") as any).select("id").eq("status", "PENDING"),
        (supabase.from("seo_backlink_outreach") as any).select("id").eq("status", "REPLIED"),
        (supabase.from("seo_backlink_outreach") as any).select("id").eq("status", "LINK_ACQUIRED"),
        (supabase.from("seo_internal_link_suggestions") as any).select("id").eq("status", "SUGGESTED"),
        (supabase.from("seo_page_audits") as any).select("id"),
        (supabase.from("seo_content_workflow") as any).select("id").eq("approval_status", "UNDER_REVIEW"),
        (supabase.from("seo_roadmaps") as any).select("id"),
      ]);

      setStats({
        tasksDueToday: dueToday?.length || 0,
        tasksOverdue: overdue?.length || 0,
        blogsScheduled: blogs?.length || 0,
        gmbScheduled: gmb?.length || 0,
        totalActive: projects.filter(p => p.project_status === "ACTIVE").length,
        newBacklinks: newBl?.length || 0,
        lostBacklinks: lostBl?.length || 0,
        lowScorePages: lowPages?.length || 0,
        gapOpportunities: highGaps?.length || 0,
        outreachPending: outPending?.length || 0,
        outreachReplied: outReplied?.length || 0,
        linksAcquired: linksAcq?.length || 0,
        pendingInternalLinks: pendLinks?.length || 0,
        pagesAudited: audited?.length || 0,
        criticalIssues: 0,
        contentPendingApproval: contentPend?.length || 0,
        activeRoadmaps: roadmaps?.length || 0,
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
        <p className="text-muted-foreground">Overview: tasks, rankings, outreach, audits & content</p>
      </div>

      {/* Row 1 - Core */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Active Projects</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{stats.totalActive}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><ListChecks className="h-3 w-3" />Due Today</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-primary">{stats.tasksDueToday}</p></CardContent></Card>
        <Card className={stats.tasksOverdue > 0 ? "border-destructive" : ""}><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Overdue</CardTitle></CardHeader><CardContent><p className={`text-2xl font-bold ${stats.tasksOverdue > 0 ? "text-destructive" : ""}`}>{stats.tasksOverdue}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><FileText className="h-3 w-3" />Blogs Pending</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{stats.blogsScheduled}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />GMB Scheduled</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{stats.gmbScheduled}</p></CardContent></Card>
      </div>

      {/* Row 2 - Intelligence */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" />New Backlinks</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-green-600">{stats.newBacklinks}</p></CardContent></Card>
        <Card className={stats.lostBacklinks > 0 ? "border-destructive/50" : ""}><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><TrendingDown className="h-3 w-3" />Lost Backlinks</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-destructive">{stats.lostBacklinks}</p></CardContent></Card>
        <Card className={stats.lowScorePages > 0 ? "border-yellow-500/50" : ""}><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><BarChart3 className="h-3 w-3" />Low SEO Score</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{stats.lowScorePages}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Target className="h-3 w-3" />Gap Opportunities</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-primary">{stats.gapOpportunities}</p></CardContent></Card>
      </div>

      {/* Row 3 - Execution */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />Outreach Sent</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{stats.outreachPending}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Replies</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-yellow-600">{stats.outreachReplied}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Links Acquired</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-green-600">{stats.linksAcquired}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Link2 className="h-3 w-3" />Pending Links</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{stats.pendingInternalLinks}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Search className="h-3 w-3" />Pages Audited</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{stats.pagesAudited}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Content Review</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-yellow-600">{stats.contentPendingApproval}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><MapIcon className="h-3 w-3" />Roadmaps</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{stats.activeRoadmaps}</p></CardContent></Card>
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
