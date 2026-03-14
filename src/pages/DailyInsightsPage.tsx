import { useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useAuth } from "@/contexts/AuthContext";
import { useDailyInsights, useInsightViews } from "@/hooks/useDailyInsights";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Plus, Video, Eye, Users, CheckCircle, Trash2, BarChart3 } from "lucide-react";
import { format } from "date-fns";

const DEPARTMENTS = ["All Employees", "Sales", "SEO", "Accounts", "HR", "Development", "Management"];

const priorityColors: Record<string, string> = {
  normal: "bg-info/10 text-info",
  important: "bg-warning/10 text-warning",
  mandatory: "bg-destructive/10 text-destructive",
};

export default function DailyInsightsPage() {
  usePageTitle("Daily Insights", "Internal broadcast and learning system for employees.");
  const { isSuperAdmin, isBusinessAdmin, isHRManager } = useAuth();
  const canManage = isSuperAdmin || isBusinessAdmin || isHRManager;
  const { insights, loading, createInsight, deleteInsight } = useDailyInsights();
  const { views } = useInsightViews();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"library" | "analytics">("library");

  // Form state
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [message, setMessage] = useState("");
  const [nextwebApp, setNextwebApp] = useState("");
  const [depts, setDepts] = useState<string[]>(["All Employees"]);
  const [priority, setPriority] = useState("normal");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [expiryDate, setExpiryDate] = useState("");
  const [allowComments, setAllowComments] = useState(true);
  const [requireAck, setRequireAck] = useState(false);

  const handlePublish = async () => {
    if (!title.trim()) return;
    await createInsight({
      title,
      video_url: videoUrl || null,
      message: message || null,
      nextweb_application: nextwebApp || null,
      department_target: depts.includes("All Employees") ? ["all"] : depts.map((d) => d.toLowerCase()),
      priority_level: priority,
      start_date: startDate,
      expiry_date: expiryDate || null,
      allow_comments: allowComments,
      require_acknowledgement: requireAck,
    });
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setTitle(""); setVideoUrl(""); setMessage(""); setNextwebApp("");
    setDepts(["All Employees"]); setPriority("normal");
    setStartDate(new Date().toISOString().split("T")[0]); setExpiryDate("");
    setAllowComments(true); setRequireAck(false);
  };

  const toggleDept = (d: string) => {
    if (d === "All Employees") { setDepts(["All Employees"]); return; }
    setDepts((prev) => {
      const without = prev.filter((x) => x !== "All Employees");
      return without.includes(d) ? without.filter((x) => x !== d) : [...without, d];
    });
  };

  const getViewCount = (insightId: string) => views.filter((v) => v.insight_id === insightId).length;
  const getAckCount = (insightId: string) => views.filter((v) => v.insight_id === insightId && v.acknowledged).length;

  if (loading) return <div className="p-6 space-y-4">{[1,2,3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Insights"
        subtitle="Internal learning, motivation and business improvement broadcasts."
        actions={
          canManage ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" /> Publish Insight</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Publish New Insight</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div><Label>Title *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Sales Strategy Update" /></div>
                  <div><Label>Video URL (YouTube / Vimeo)</Label><Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." /></div>
                  <div><Label>Message / Description</Label><Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="What's the insight about?" rows={3} /></div>
                  <div><Label>How this applies to NextWeb</Label><Textarea value={nextwebApp} onChange={(e) => setNextwebApp(e.target.value)} placeholder="How employees can apply this..." rows={2} /></div>
                  <div>
                    <Label className="mb-2 block">Department Targeting</Label>
                    <div className="flex flex-wrap gap-3">
                      {DEPARTMENTS.map((d) => (
                        <label key={d} className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox checked={depts.includes(d)} onCheckedChange={() => toggleDept(d)} />
                          {d}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Priority Level</Label>
                      <Select value={priority} onValueChange={setPriority}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="important">Important</SelectItem>
                          <SelectItem value="mandatory">Mandatory</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Start Date</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Expiry Date</Label><Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} /></div>
                  </div>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 text-sm"><Switch checked={allowComments} onCheckedChange={setAllowComments} /> Allow Comments</label>
                    <label className="flex items-center gap-2 text-sm"><Switch checked={requireAck} onCheckedChange={setRequireAck} /> Require Acknowledgement</label>
                  </div>
                  <Button onClick={handlePublish} className="w-full" disabled={!title.trim()}>Publish Insight</Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : undefined
        }
      />

      {/* Tab toggle */}
      {canManage && (
        <div className="flex gap-2">
          <Button variant={tab === "library" ? "default" : "outline"} size="sm" onClick={() => setTab("library")}>Library</Button>
          <Button variant={tab === "analytics" ? "default" : "outline"} size="sm" onClick={() => setTab("analytics")} className="gap-1"><BarChart3 className="h-3.5 w-3.5" /> Analytics</Button>
        </div>
      )}

      {tab === "library" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {insights.length === 0 && <p className="text-muted-foreground col-span-full text-center py-12">No insights published yet.</p>}
          {insights.map((ins) => (
            <Card key={ins.id} className="group hover-lift transition-all">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <Badge className={priorityColors[ins.priority_level] || ""}>{ins.priority_level}</Badge>
                    <CardTitle className="text-base">{ins.title}</CardTitle>
                  </div>
                  {ins.video_url && <Video className="h-5 w-5 text-muted-foreground" />}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {ins.message && <p className="text-sm text-muted-foreground line-clamp-2">{ins.message}</p>}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {getViewCount(ins.id)} views</span>
                  {ins.require_acknowledgement && <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> {getAckCount(ins.id)} ack</span>}
                  <span>{ins.start_date ? format(new Date(ins.start_date), "MMM d") : ""}</span>
                </div>
                {canManage && (
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteInsight(ins.id)}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <InsightAnalytics insights={insights} views={views} />
      )}
    </div>
  );
}

function InsightAnalytics({ insights, views }: { insights: any[]; views: any[] }) {
  const totalEmployees = new Set(views.map((v) => v.employee_id)).size;
  const totalViewed = views.length;
  const totalAcknowledged = views.filter((v) => v.acknowledged).length;
  const completionRate = totalEmployees > 0 ? ((totalViewed / Math.max(totalEmployees * insights.length, 1)) * 100).toFixed(0) : "0";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{insights.length}</p><p className="text-xs text-muted-foreground">Total Insights</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{totalViewed}</p><p className="text-xs text-muted-foreground">Total Views</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{totalAcknowledged}</p><p className="text-xs text-muted-foreground">Acknowledged</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{completionRate}%</p><p className="text-xs text-muted-foreground">Completion Rate</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Employee Engagement</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Insight</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Acknowledged</TableHead>
                <TableHead>Priority</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {insights.map((ins) => {
                const insViews = views.filter((v) => v.insight_id === ins.id);
                return (
                  <TableRow key={ins.id}>
                    <TableCell className="font-medium">{ins.title}</TableCell>
                    <TableCell>{insViews.length}</TableCell>
                    <TableCell>{insViews.filter((v) => v.acknowledged).length}</TableCell>
                    <TableCell><Badge className={priorityColors[ins.priority_level] || ""}>{ins.priority_level}</Badge></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
