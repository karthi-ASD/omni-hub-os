import { useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSeoKeywords, useSeoOnpageTasks, useSeoOffpageItems, useSeoContent } from "@/hooks/useSeo";
import { useSeoProjects } from "@/hooks/useSeoProjects";
import { useSeoGbp } from "@/hooks/useSeoGbp";
import { useSeoTechnical } from "@/hooks/useSeoTechnical";
import { useSeoReports } from "@/hooks/useSeoReports";
import { useSeoComms } from "@/hooks/useSeoComms";
import { useSeoSiteAudit } from "@/hooks/useSeoSiteAudit";
import { useGscData } from "@/hooks/useGscData";
import { useKeywordRankingHistory } from "@/hooks/useKeywordRankingHistory";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SeoAuditPanel } from "@/components/seo/SeoAuditPanel";
import { SeoTechnicalPanel } from "@/components/seo/SeoTechnicalPanel";
import { KeywordCsvImportDialog } from "@/components/seo/KeywordCsvImportDialog";
import { SeoRankingPanel } from "@/components/seo/SeoRankingPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { SeoProjectOverview } from "@/components/seo/SeoProjectOverview";
import {
  ArrowLeft, Key, FileText, Link, Globe, BarChart3, MessageSquare,
  MapPin, Wrench, Plus, LayoutDashboard, CheckSquare, Settings, Scan, TrendingUp,
  Upload, Download,
} from "lucide-react";
import { toast } from "sonner";

const statusBadge = (status: string) => {
  const colors: Record<string, string> = {
    planned: "bg-muted text-muted-foreground",
    active: "bg-success/10 text-success",
    dropped: "bg-destructive/10 text-destructive",
    todo: "bg-muted text-muted-foreground",
    in_progress: "bg-info/10 text-info",
    done: "bg-success/10 text-success",
    needs_client_approval: "bg-warning/10 text-warning",
    submitted: "bg-info/10 text-info",
    live: "bg-success/10 text-success",
    rejected: "bg-destructive/10 text-destructive",
    briefed: "bg-muted text-muted-foreground",
    writing: "bg-info/10 text-info",
    review: "bg-warning/10 text-warning",
    client_approval: "bg-warning/10 text-warning",
    published: "bg-success/10 text-success",
  };
  return <Badge className={colors[status] || ""} variant="secondary">{status.replace(/_/g, " ")}</Badge>;
};

const SeoCampaignDetailPage = () => {
  const { campaignId: projectId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const { projects } = useSeoProjects();
  const project = projects.find((p) => p.id === projectId);
  const { keywords, loading: kwLoading, addKeyword, updateKeywordStatus } = useSeoKeywords(projectId);
  const { tasks, loading: taskLoading, addTask, updateTaskStatus } = useSeoOnpageTasks(projectId);
  const { items: offpageItems, loading: offLoading, addItem, updateItemStatus } = useSeoOffpageItems(projectId);
  const { content, loading: contentLoading, addContent, updateContentStatus } = useSeoContent(projectId);
  const { gbp, loading: gbpLoading, upsert: upsertGbp } = useSeoGbp(projectId);
  const { audit, loading: techLoading, upsert: upsertTech } = useSeoTechnical(projectId);
  const { reports, loading: reportLoading, addReport } = useSeoReports(projectId);
  const { logs: commLogs, loading: commLoading, addLog: addComm } = useSeoComms(projectId);
  const { audits: pageAudits, loading: auditLoading, crawling, crawlProgress, runFullAudit } = useSeoSiteAudit(projectId, project?.website_domain);
  const { data: gscData, loading: gscLoading, refetch: refetchGsc } = useGscData(projectId);
  const { profile } = useAuth();
  const keywordIds = useMemo(() => keywords.map(k => k.id), [keywords]);
  const { history: rankingHistory, refetch: refetchHistory } = useKeywordRankingHistory(keywordIds);
  const [syncing, setSyncing] = useState(false);

  const syncRankings = useCallback(async () => {
    if (!profile?.business_id || !projectId || !project?.website_domain) return;
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("seo-gsc-sync", {
        body: {
          business_id: profile.business_id,
          seo_project_id: projectId,
          domain: project.website_domain,
          client_id: project.client_id,
          days: 28,
        },
      });
      if (error) throw error;
      toast.success(data?.message || `Rankings synced: ${data?.rows || 0} data points`);
      refetchGsc();
      refetchHistory();
    } catch (e: any) {
      toast.error("Sync failed: " + (e.message || "Unknown error"));
    } finally {
      setSyncing(false);
    }
  }, [profile, projectId, project, refetchGsc, refetchHistory]);

  // Form states
  const [kwOpen, setKwOpen] = useState(false);
  const [kwForm, setKwForm] = useState({ keyword: "", keyword_type: "primary", priority: "medium", target_url: "", location: "" });
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({ page_url: "", checklist_item: "" });
  const [offOpen, setOffOpen] = useState(false);
  const [offForm, setOffForm] = useState({ type: "citation", source_url: "", target_url: "", website_name: "", da_score: "", anchor_text: "", follow_type: "dofollow" });
  const [contentOpen, setContentOpen] = useState(false);
  const [contentForm, setContentForm] = useState({ type: "blog", title: "", brief: "", target_url: "", target_keyword: "", word_count: "" });
  const [reportOpen, setReportOpen] = useState(false);
  const [reportForm, setReportForm] = useState({ report_month: "", traffic_current: 0, traffic_previous: 0, keywords_improved: 0, keywords_dropped: 0, backlinks_built: 0, tasks_completed: 0, conversions: 0 });
  const [commOpen, setCommOpen] = useState(false);
  const [commForm, setCommForm] = useState({ communication_type: "email", summary: "", follow_up_date: "" });
  const [gbpForm, setGbpForm] = useState({ existing_listing: false, listing_url: "", verification_status: "not_started", nap_consistency_check: false, reviews_count: 0, rating_avg: 0, gmb_posts_count: 0 });
  const [gbpEditing, setGbpEditing] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/seo")} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold truncate">{project?.project_name || "Project Detail"}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            {project?.website_domain && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Globe className="h-3 w-3" /> {project.website_domain}
              </span>
            )}
            {project?.service_package && <Badge variant="outline" className="capitalize text-xs">{project.service_package}</Badge>}
            {project?.project_status && <Badge variant="secondary" className="capitalize text-xs">{project.project_status}</Badge>}
          </div>
        </div>
      </div>

      {/* Workspace Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <div className="overflow-x-auto -mx-1 px-1">
          <TabsList className="inline-flex h-10 w-auto">
            <TabsTrigger value="overview" className="gap-1.5 text-xs"><LayoutDashboard className="h-3 w-3" /> Overview</TabsTrigger>
            <TabsTrigger value="audit" className="gap-1.5 text-xs"><Scan className="h-3 w-3" /> Audit</TabsTrigger>
            <TabsTrigger value="rankings" className="gap-1.5 text-xs"><TrendingUp className="h-3 w-3" /> Rankings</TabsTrigger>
            <TabsTrigger value="keywords" className="gap-1.5 text-xs"><Key className="h-3 w-3" /> Keywords</TabsTrigger>
            <TabsTrigger value="onpage" className="gap-1.5 text-xs"><FileText className="h-3 w-3" /> On-Page</TabsTrigger>
            <TabsTrigger value="offpage" className="gap-1.5 text-xs"><Link className="h-3 w-3" /> Off-Page</TabsTrigger>
            <TabsTrigger value="content" className="gap-1.5 text-xs"><Globe className="h-3 w-3" /> Content</TabsTrigger>
            <TabsTrigger value="gbp" className="gap-1.5 text-xs"><MapPin className="h-3 w-3" /> Local SEO</TabsTrigger>
            <TabsTrigger value="technical" className="gap-1.5 text-xs"><Wrench className="h-3 w-3" /> Technical</TabsTrigger>
            <TabsTrigger value="reports" className="gap-1.5 text-xs"><BarChart3 className="h-3 w-3" /> Reports</TabsTrigger>
            <TabsTrigger value="comms" className="gap-1.5 text-xs"><MessageSquare className="h-3 w-3" /> Comms</TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview">
          {project ? (
            <SeoProjectOverview project={project} keywords={keywords} tasks={tasks} />
          ) : (
            <Skeleton className="h-48 w-full" />
          )}
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit">
          <SeoAuditPanel
            audits={pageAudits}
            loading={auditLoading}
            crawling={crawling}
            crawlProgress={crawlProgress}
            onRunAudit={runFullAudit}
          />
        </TabsContent>

        {/* Rankings Tab */}
        <TabsContent value="rankings">
          <SeoRankingPanel
            gscData={gscData}
            keywords={keywords}
            rankingHistory={rankingHistory}
            gscLoading={gscLoading}
            syncing={syncing}
            onSync={syncRankings}
          />
        </TabsContent>

        {/* Keywords Tab */}
        <TabsContent value="keywords" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Keywords ({keywords.length})</h2>
            <Dialog open={kwOpen} onOpenChange={setKwOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-3 w-3 mr-1" /> Add</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Keyword</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Keyword</Label><Input value={kwForm.keyword} onChange={(e) => setKwForm({ ...kwForm, keyword: e.target.value })} /></div>
                  <div><Label>Type</Label>
                    <Select value={kwForm.keyword_type} onValueChange={(v) => setKwForm({ ...kwForm, keyword_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{["primary", "secondary", "service", "location", "blog"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Location</Label><Input value={kwForm.location} onChange={(e) => setKwForm({ ...kwForm, location: e.target.value })} placeholder="e.g. Sydney" /></div>
                  <div><Label>Priority</Label>
                    <Select value={kwForm.priority} onValueChange={(v) => setKwForm({ ...kwForm, priority: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{["low", "medium", "high"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Target URL</Label><Input value={kwForm.target_url} onChange={(e) => setKwForm({ ...kwForm, target_url: e.target.value })} /></div>
                  <Button className="w-full" onClick={async () => { await addKeyword(kwForm as any); setKwOpen(false); setKwForm({ keyword: "", keyword_type: "primary", priority: "medium", target_url: "", location: "" }); }}>Add Keyword</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {kwLoading ? <Skeleton className="h-24 w-full" /> : keywords.length === 0 ? (
            <Card className="rounded-2xl border-0 shadow-elevated"><CardContent className="py-8 text-center text-muted-foreground">No keywords yet</CardContent></Card>
          ) : (
            <Card className="rounded-2xl border-0 shadow-elevated overflow-hidden"><Table><TableHeader><TableRow>
              <TableHead>Keyword</TableHead><TableHead>Type</TableHead><TableHead>Location</TableHead><TableHead>Ranking</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
            </TableRow></TableHeader><TableBody>
              {keywords.map((kw: any) => (
                <TableRow key={kw.id}>
                  <TableCell className="font-medium">{kw.keyword}</TableCell>
                  <TableCell className="capitalize">{kw.keyword_type}</TableCell>
                  <TableCell>{kw.location || "—"}</TableCell>
                  <TableCell>
                    {kw.current_ranking != null ? (
                      <span className="font-mono">
                        #{kw.current_ranking}
                        {kw.previous_ranking != null && (
                          <span className={kw.current_ranking < kw.previous_ranking ? "text-success ml-1" : kw.current_ranking > kw.previous_ranking ? "text-destructive ml-1" : "text-muted-foreground ml-1"}>
                            ({kw.current_ranking < kw.previous_ranking ? "↑" : kw.current_ranking > kw.previous_ranking ? "↓" : "="}{Math.abs(kw.current_ranking - kw.previous_ranking)})
                          </span>
                        )}
                      </span>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="capitalize">{kw.priority}</TableCell>
                  <TableCell>{statusBadge(kw.status)}</TableCell>
                  <TableCell>
                    <Select value={kw.status} onValueChange={(v) => updateKeywordStatus(kw.id, v)}>
                      <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{["planned", "active", "dropped"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody></Table></Card>
          )}
        </TabsContent>

        {/* On-Page Tab */}
        <TabsContent value="onpage" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">On-Page Tasks ({tasks.length})</h2>
            <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-3 w-3 mr-1" /> Add</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add On-Page Task</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Page URL</Label><Input value={taskForm.page_url} onChange={(e) => setTaskForm({ ...taskForm, page_url: e.target.value })} /></div>
                  <div><Label>Checklist Item</Label>
                    <Select value={taskForm.checklist_item} onValueChange={(v) => setTaskForm({ ...taskForm, checklist_item: v })}>
                      <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                      <SelectContent>
                        {["META_TITLE", "META_DESC", "H1", "H2", "ALT", "INTERNAL_LINKS", "SCHEMA", "SPEED", "MOBILE", "INDEXING"].map((i) => <SelectItem key={i} value={i}>{i.replace(/_/g, " ")}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full" onClick={async () => { if (!taskForm.checklist_item) return; await addTask(taskForm); setTaskOpen(false); setTaskForm({ page_url: "", checklist_item: "" }); }}>Add Task</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {taskLoading ? <Skeleton className="h-24 w-full" /> : tasks.length === 0 ? (
            <Card className="rounded-2xl border-0 shadow-elevated"><CardContent className="py-8 text-center text-muted-foreground">No on-page tasks yet</CardContent></Card>
          ) : (
            <Card className="rounded-2xl border-0 shadow-elevated overflow-hidden"><Table><TableHeader><TableRow>
              <TableHead>Item</TableHead><TableHead>Page</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
            </TableRow></TableHeader><TableBody>
              {tasks.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.checklist_item.replace(/_/g, " ")}</TableCell>
                  <TableCell className="truncate max-w-[200px]">{t.page_url || "—"}</TableCell>
                  <TableCell>{statusBadge(t.status)}</TableCell>
                  <TableCell>
                    <Select value={t.status} onValueChange={(v) => updateTaskStatus(t.id, v)}>
                      <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{["todo", "in_progress", "done", "needs_client_approval"].map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody></Table></Card>
          )}
        </TabsContent>

        {/* Off-Page Tab */}
        <TabsContent value="offpage" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Off-Page / Backlinks ({offpageItems.length})</h2>
            <Dialog open={offOpen} onOpenChange={setOffOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-3 w-3 mr-1" /> Add</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Backlink / Off-Page</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Type</Label>
                    <Select value={offForm.type} onValueChange={(v) => setOffForm({ ...offForm, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{["citation", "backlink", "guest_post", "profile", "directory"].map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Website Name</Label><Input value={offForm.website_name} onChange={(e) => setOffForm({ ...offForm, website_name: e.target.value })} /></div>
                  <div><Label>Source URL</Label><Input value={offForm.source_url} onChange={(e) => setOffForm({ ...offForm, source_url: e.target.value })} /></div>
                  <div><Label>Target URL</Label><Input value={offForm.target_url} onChange={(e) => setOffForm({ ...offForm, target_url: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>DA Score</Label><Input type="number" value={offForm.da_score} onChange={(e) => setOffForm({ ...offForm, da_score: e.target.value })} /></div>
                    <div><Label>Follow Type</Label>
                      <Select value={offForm.follow_type} onValueChange={(v) => setOffForm({ ...offForm, follow_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="dofollow">DoFollow</SelectItem><SelectItem value="nofollow">NoFollow</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div><Label>Anchor Text</Label><Input value={offForm.anchor_text} onChange={(e) => setOffForm({ ...offForm, anchor_text: e.target.value })} /></div>
                  <Button className="w-full" onClick={async () => {
                    await addItem({ ...offForm, da_score: offForm.da_score ? Number(offForm.da_score) : undefined } as any);
                    setOffOpen(false);
                    setOffForm({ type: "citation", source_url: "", target_url: "", website_name: "", da_score: "", anchor_text: "", follow_type: "dofollow" });
                  }}>Add Item</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {offLoading ? <Skeleton className="h-24 w-full" /> : offpageItems.length === 0 ? (
            <Card className="rounded-2xl border-0 shadow-elevated"><CardContent className="py-8 text-center text-muted-foreground">No off-page items yet</CardContent></Card>
          ) : (
            <Card className="rounded-2xl border-0 shadow-elevated overflow-hidden"><Table><TableHeader><TableRow>
              <TableHead>Type</TableHead><TableHead>Website</TableHead><TableHead>DA</TableHead><TableHead>Anchor</TableHead><TableHead>Follow</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
            </TableRow></TableHeader><TableBody>
              {offpageItems.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="capitalize">{item.type.replace(/_/g, " ")}</TableCell>
                  <TableCell>{item.website_name || item.source_url?.substring(0, 30) || "—"}</TableCell>
                  <TableCell>{item.da_score || "—"}</TableCell>
                  <TableCell className="truncate max-w-[100px]">{item.anchor_text || "—"}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{item.follow_type || "dofollow"}</Badge></TableCell>
                  <TableCell>{statusBadge(item.status)}</TableCell>
                  <TableCell>
                    <Select value={item.status} onValueChange={(v) => updateItemStatus(item.id, v)}>
                      <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{["planned", "submitted", "live", "rejected"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody></Table></Card>
          )}
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Content Pipeline ({content.length})</h2>
            <Dialog open={contentOpen} onOpenChange={setContentOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-3 w-3 mr-1" /> Add</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Content Item</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Type</Label>
                    <Select value={contentForm.type} onValueChange={(v) => setContentForm({ ...contentForm, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{["service_page", "location_page", "blog", "landing_page", "homepage"].map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Title</Label><Input value={contentForm.title} onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })} /></div>
                  <div><Label>Target Keyword</Label><Input value={contentForm.target_keyword} onChange={(e) => setContentForm({ ...contentForm, target_keyword: e.target.value })} /></div>
                  <div><Label>Word Count</Label><Input type="number" value={contentForm.word_count} onChange={(e) => setContentForm({ ...contentForm, word_count: e.target.value })} /></div>
                  <div><Label>Brief</Label><Input value={contentForm.brief} onChange={(e) => setContentForm({ ...contentForm, brief: e.target.value })} /></div>
                  <div><Label>Target URL</Label><Input value={contentForm.target_url} onChange={(e) => setContentForm({ ...contentForm, target_url: e.target.value })} /></div>
                  <Button className="w-full" onClick={async () => {
                    if (!contentForm.title) return;
                    await addContent({ ...contentForm, word_count: contentForm.word_count ? Number(contentForm.word_count) : undefined } as any);
                    setContentOpen(false);
                    setContentForm({ type: "blog", title: "", brief: "", target_url: "", target_keyword: "", word_count: "" });
                  }}>Add Content</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {contentLoading ? <Skeleton className="h-24 w-full" /> : content.length === 0 ? (
            <Card className="rounded-2xl border-0 shadow-elevated"><CardContent className="py-8 text-center text-muted-foreground">No content items yet</CardContent></Card>
          ) : (
            <Card className="rounded-2xl border-0 shadow-elevated overflow-hidden"><Table><TableHeader><TableRow>
              <TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Keyword</TableHead><TableHead>Words</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
            </TableRow></TableHeader><TableBody>
              {content.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.title}</TableCell>
                  <TableCell className="capitalize">{c.type.replace(/_/g, " ")}</TableCell>
                  <TableCell>{c.target_keyword || "—"}</TableCell>
                  <TableCell>{c.word_count || "—"}</TableCell>
                  <TableCell>{statusBadge(c.status)}</TableCell>
                  <TableCell>
                    <Select value={c.status} onValueChange={(v) => updateContentStatus(c.id, v)}>
                      <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{["briefed", "writing", "review", "client_approval", "published"].map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody></Table></Card>
          )}
        </TabsContent>

        {/* GBP / Local SEO Tab */}
        <TabsContent value="gbp" className="space-y-4">
          <h2 className="text-lg font-semibold">Google Business Profile / Local SEO</h2>
          {gbpLoading ? <Skeleton className="h-48 w-full" /> : (
            <Card className="rounded-2xl border-0 shadow-elevated">
              <CardContent className="pt-6 space-y-4">
                {!gbpEditing && gbp ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div><Label className="text-muted-foreground text-xs">Existing Listing</Label><p>{gbp.existing_listing ? "Yes" : "No"}</p></div>
                      <div><Label className="text-muted-foreground text-xs">Verification</Label><p className="capitalize">{gbp.verification_status.replace(/_/g, " ")}</p></div>
                      <div><Label className="text-muted-foreground text-xs">Reviews</Label><p>{gbp.reviews_count} ({gbp.rating_avg}★)</p></div>
                      <div><Label className="text-muted-foreground text-xs">NAP Check</Label><p>{gbp.nap_consistency_check ? "✅ Done" : "❌ Pending"}</p></div>
                      <div><Label className="text-muted-foreground text-xs">GMB Posts</Label><p>{gbp.gmb_posts_count}</p></div>
                      <div><Label className="text-muted-foreground text-xs">Listing URL</Label><p className="truncate text-sm">{gbp.listing_url || "—"}</p></div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { setGbpForm({ existing_listing: gbp.existing_listing, listing_url: gbp.listing_url || "", verification_status: gbp.verification_status, nap_consistency_check: gbp.nap_consistency_check, reviews_count: gbp.reviews_count, rating_avg: gbp.rating_avg, gmb_posts_count: gbp.gmb_posts_count }); setGbpEditing(true); }}>Edit</Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2"><Switch checked={gbpForm.existing_listing} onCheckedChange={(v) => setGbpForm({ ...gbpForm, existing_listing: v })} /><Label>Existing Listing</Label></div>
                    <div><Label>Listing URL</Label><Input value={gbpForm.listing_url} onChange={(e) => setGbpForm({ ...gbpForm, listing_url: e.target.value })} /></div>
                    <div><Label>Verification Status</Label>
                      <Select value={gbpForm.verification_status} onValueChange={(v) => setGbpForm({ ...gbpForm, verification_status: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{["not_started", "pending_video", "verified"].map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2"><Switch checked={gbpForm.nap_consistency_check} onCheckedChange={(v) => setGbpForm({ ...gbpForm, nap_consistency_check: v })} /><Label>NAP Consistency Checked</Label></div>
                    <div className="grid grid-cols-3 gap-2">
                      <div><Label>Reviews</Label><Input type="number" value={gbpForm.reviews_count} onChange={(e) => setGbpForm({ ...gbpForm, reviews_count: Number(e.target.value) })} /></div>
                      <div><Label>Rating</Label><Input type="number" step="0.1" value={gbpForm.rating_avg} onChange={(e) => setGbpForm({ ...gbpForm, rating_avg: Number(e.target.value) })} /></div>
                      <div><Label>Posts</Label><Input type="number" value={gbpForm.gmb_posts_count} onChange={(e) => setGbpForm({ ...gbpForm, gmb_posts_count: Number(e.target.value) })} /></div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={async () => { await upsertGbp(gbpForm as any); setGbpEditing(false); }}>Save</Button>
                      {gbp && <Button variant="outline" onClick={() => setGbpEditing(false)}>Cancel</Button>}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Technical SEO Tab */}
        <TabsContent value="technical">
          <SeoTechnicalPanel
            audit={audit}
            loading={techLoading}
            onSave={upsertTech}
          />
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Monthly Reports ({reports.length})</h2>
            <Dialog open={reportOpen} onOpenChange={setReportOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-3 w-3 mr-1" /> Add Report</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Monthly Report</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Report Month (e.g. 2026-02)</Label><Input value={reportForm.report_month} onChange={(e) => setReportForm({ ...reportForm, report_month: e.target.value })} placeholder="YYYY-MM" /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>Traffic (Current)</Label><Input type="number" value={reportForm.traffic_current} onChange={(e) => setReportForm({ ...reportForm, traffic_current: Number(e.target.value) })} /></div>
                    <div><Label>Traffic (Previous)</Label><Input type="number" value={reportForm.traffic_previous} onChange={(e) => setReportForm({ ...reportForm, traffic_previous: Number(e.target.value) })} /></div>
                    <div><Label>Keywords Improved</Label><Input type="number" value={reportForm.keywords_improved} onChange={(e) => setReportForm({ ...reportForm, keywords_improved: Number(e.target.value) })} /></div>
                    <div><Label>Keywords Dropped</Label><Input type="number" value={reportForm.keywords_dropped} onChange={(e) => setReportForm({ ...reportForm, keywords_dropped: Number(e.target.value) })} /></div>
                    <div><Label>Backlinks Built</Label><Input type="number" value={reportForm.backlinks_built} onChange={(e) => setReportForm({ ...reportForm, backlinks_built: Number(e.target.value) })} /></div>
                    <div><Label>Tasks Completed</Label><Input type="number" value={reportForm.tasks_completed} onChange={(e) => setReportForm({ ...reportForm, tasks_completed: Number(e.target.value) })} /></div>
                  </div>
                  <div><Label>Conversions</Label><Input type="number" value={reportForm.conversions} onChange={(e) => setReportForm({ ...reportForm, conversions: Number(e.target.value) })} /></div>
                  <Button className="w-full" onClick={async () => {
                    if (!reportForm.report_month) return;
                    await addReport(reportForm as any);
                    setReportOpen(false);
                    setReportForm({ report_month: "", traffic_current: 0, traffic_previous: 0, keywords_improved: 0, keywords_dropped: 0, backlinks_built: 0, tasks_completed: 0, conversions: 0 });
                  }}>Add Report</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {reportLoading ? <Skeleton className="h-24 w-full" /> : reports.length === 0 ? (
            <Card className="rounded-2xl border-0 shadow-elevated"><CardContent className="py-8 text-center text-muted-foreground">No reports yet</CardContent></Card>
          ) : (
            <Card className="rounded-2xl border-0 shadow-elevated overflow-hidden"><Table><TableHeader><TableRow>
              <TableHead>Month</TableHead><TableHead>Traffic</TableHead><TableHead>KW ↑</TableHead><TableHead>KW ↓</TableHead><TableHead>Backlinks</TableHead><TableHead>Tasks</TableHead><TableHead>Conversions</TableHead>
            </TableRow></TableHeader><TableBody>
              {reports.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.report_month}</TableCell>
                  <TableCell>{r.traffic_current} <span className="text-xs text-muted-foreground">(prev: {r.traffic_previous})</span></TableCell>
                  <TableCell className="text-success">{r.keywords_improved}</TableCell>
                  <TableCell className="text-destructive">{r.keywords_dropped}</TableCell>
                  <TableCell>{r.backlinks_built}</TableCell>
                  <TableCell>{r.tasks_completed}</TableCell>
                  <TableCell>{r.conversions}</TableCell>
                </TableRow>
              ))}
            </TableBody></Table></Card>
          )}
        </TabsContent>

        {/* Communications Tab */}
        <TabsContent value="comms" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Communication Log ({commLogs.length})</h2>
            <Dialog open={commOpen} onOpenChange={setCommOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-3 w-3 mr-1" /> Log</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Log Communication</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Type</Label>
                    <Select value={commForm.communication_type} onValueChange={(v) => setCommForm({ ...commForm, communication_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{["email", "call", "whatsapp", "sms", "meeting"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Summary</Label><Textarea value={commForm.summary} onChange={(e) => setCommForm({ ...commForm, summary: e.target.value })} /></div>
                  <div><Label>Follow-up Date</Label><Input type="date" value={commForm.follow_up_date} onChange={(e) => setCommForm({ ...commForm, follow_up_date: e.target.value })} /></div>
                  <Button className="w-full" onClick={async () => {
                    await addComm(commForm);
                    setCommOpen(false);
                    setCommForm({ communication_type: "email", summary: "", follow_up_date: "" });
                  }}>Log Communication</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {commLoading ? <Skeleton className="h-24 w-full" /> : commLogs.length === 0 ? (
            <Card className="rounded-2xl border-0 shadow-elevated"><CardContent className="py-8 text-center text-muted-foreground">No communication logs yet</CardContent></Card>
          ) : (
            <Card className="rounded-2xl border-0 shadow-elevated overflow-hidden"><Table><TableHeader><TableRow>
              <TableHead>Type</TableHead><TableHead>Summary</TableHead><TableHead>Follow-up</TableHead><TableHead>Date</TableHead>
            </TableRow></TableHeader><TableBody>
              {commLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="capitalize">{log.communication_type}</TableCell>
                  <TableCell className="max-w-[300px] truncate">{log.summary || "—"}</TableCell>
                  <TableCell>{log.follow_up_date || "—"}</TableCell>
                  <TableCell>{new Date(log.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody></Table></Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SeoCampaignDetailPage;
