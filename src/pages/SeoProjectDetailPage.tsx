import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useSeoProjects } from "@/hooks/useSeoProjects";
import { useSeoTasks, TASK_CATEGORIES, TASK_STATUSES, TASK_PRIORITIES } from "@/hooks/useSeoTasks";
import { useSeoBlogs } from "@/hooks/useSeoBlogs";
import { useGmbTasks } from "@/hooks/useGmbTasks";
import { useSocialMediaTasks } from "@/hooks/useSocialMediaTasks";
import { useSeoCompetitors } from "@/hooks/useSeoCompetitors";
import { useSeoUpdates, UPDATE_TYPES } from "@/hooks/useSeoUpdates";
import { useSeoClientMessages } from "@/hooks/useSeoClientMessages";
import { useSeoMonthlyReports } from "@/hooks/useSeoMonthlyReports";
import { useSeoAiRecommendations } from "@/hooks/useSeoAiRecommendations";
import { useSeoKeywords } from "@/hooks/useSeo";
import { PerformanceDashboard } from "@/components/clients/access-hub/PerformanceDashboard";
import { ProjectIntegrationsTab } from "@/components/seo/ProjectIntegrationsTab";
import { MapsPerformancePanel } from "@/components/seo/MapsPerformancePanel";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, Plus, ListChecks, FileText, Globe, MapPin, Share2, MessageSquare,
  BarChart3, Brain, Send, Sparkles, Instagram, Facebook, Key, Plug,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const SeoProjectDetailPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { projects } = useSeoProjects();
  const project = projects.find(p => p.id === projectId);

  // All sub-hooks
  const { tasks, loading: tasksLoading, create: createTask, updateTask } = useSeoTasks(projectId);
  const { blogs, loading: blogsLoading, create: createBlog, updateBlog } = useSeoBlogs(projectId);
  const { tasks: gmbTasks, loading: gmbLoading, create: createGmb, updateTask: updateGmb } = useGmbTasks(projectId);
  const { tasks: socialTasks, loading: socialLoading, create: createSocial, updateTask: updateSocial } = useSocialMediaTasks(projectId);
  const { competitors, loading: compLoading, addCompetitor, refetch: refetchCompetitors } = useSeoCompetitors(projectId);
  const [fetchingCompetitors, setFetchingCompetitors] = useState(false);
  const { updates, loading: updLoading, create: createUpdate } = useSeoUpdates(projectId);
  const { messages, loading: msgLoading, send: sendMessage } = useSeoClientMessages(projectId);
  const { reports, loading: repLoading, generate: generateReport } = useSeoMonthlyReports(projectId);
  const { recommendations, loading: recLoading, generating, generateRecommendations, updateStatus: updateRecStatus } = useSeoAiRecommendations(projectId);

  // Form states
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({ task_category: "TECHNICAL_SEO", task_title: "", task_description: "", priority: "MEDIUM", deadline: "" });
  const [blogOpen, setBlogOpen] = useState(false);
  const [blogForm, setBlogForm] = useState({ blog_title: "", blog_topic: "", publish_date: "" });
  const [gmbOpen, setGmbOpen] = useState(false);
  const [gmbForm, setGmbForm] = useState({ post_type: "UPDATE", post_caption: "", cta_text: "", scheduled_date: "" });
  const [socialOpen, setSocialOpen] = useState(false);
  const [socialForm, setSocialForm] = useState({ platform: "FACEBOOK", post_caption: "", hashtags: "", post_date: "" });
  const [compOpen, setCompOpen] = useState(false);
  const [compForm, setCompForm] = useState({ competitor_domain: "", competitor_name: "" });
  const [updateOpen, setUpdateOpen] = useState(false);
  const [updateForm, setUpdateForm] = useState({ update_type: "TECHNICAL_FIX", title: "", description: "" });
  const [msgInput, setMsgInput] = useState("");

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-muted text-muted-foreground", IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", BLOCKED: "bg-destructive/10 text-destructive",
      WAITING_CLIENT: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      DRAFT: "bg-muted text-muted-foreground", SCHEDULED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      PUBLISHED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", POSTED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    };
    return <Badge className={colors[status] || ""} variant="secondary">{status.replace(/_/g, " ")}</Badge>;
  };

  const completedTasks = tasks.filter(t => t.status === "COMPLETED").length;
  const totalTasks = tasks.length;
  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/seo-ops")}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{project?.project_name || "SEO Project"}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="h-3 w-3" />{project?.website_domain}
            {project?.target_location && <><MapPin className="h-3 w-3 ml-2" />{project.target_location}</>}
          </div>
        </div>
        {project?.client_id && (
          <>
            <Button variant="outline" size="sm" onClick={() => navigate(`/clients/${project.client_id}/access`)}>
              <Key className="h-3 w-3 mr-1" /> Client Login Access
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate(`/clients/${project.client_id}/access`)}>
              <Plug className="h-3 w-3 mr-1" /> Client Integrations
            </Button>
          </>
        )}
        <Button variant="outline" size="sm" onClick={() => navigate(`/seo-intel/${projectId}`)}>
          <Sparkles className="h-3 w-3 mr-1" /> SEO Intelligence
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate(`/seo-exec/${projectId}`)}>
          <Sparkles className="h-3 w-3 mr-1" /> Execution Hub
        </Button>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Progress</p>
          <p className="text-lg font-bold">{progressPct}%</p>
          <Progress value={progressPct} className="w-24 h-2" />
        </div>
      </div>

      <Tabs defaultValue="tasks">
        <TabsList className="flex-wrap">
          <TabsTrigger value="tasks"><ListChecks className="h-3 w-3 mr-1" /> Tasks ({totalTasks})</TabsTrigger>
          <TabsTrigger value="blogs"><FileText className="h-3 w-3 mr-1" /> Blogs ({blogs.length})</TabsTrigger>
          <TabsTrigger value="gmb"><MapPin className="h-3 w-3 mr-1" /> GMB ({gmbTasks.length})</TabsTrigger>
          <TabsTrigger value="social"><Share2 className="h-3 w-3 mr-1" /> Social ({socialTasks.length})</TabsTrigger>
          <TabsTrigger value="competitors"><Globe className="h-3 w-3 mr-1" /> Competitors</TabsTrigger>
          <TabsTrigger value="updates"><BarChart3 className="h-3 w-3 mr-1" /> Updates</TabsTrigger>
          <TabsTrigger value="messages"><MessageSquare className="h-3 w-3 mr-1" /> Messages</TabsTrigger>
          <TabsTrigger value="reports"><BarChart3 className="h-3 w-3 mr-1" /> Reports</TabsTrigger>
          <TabsTrigger value="performance"><BarChart3 className="h-3 w-3 mr-1" /> Performance</TabsTrigger>
          <TabsTrigger value="maps"><MapPin className="h-3 w-3 mr-1" /> Maps Performance</TabsTrigger>
          <TabsTrigger value="integrations"><Plug className="h-3 w-3 mr-1" /> Integrations</TabsTrigger>
          <TabsTrigger value="ai"><Brain className="h-3 w-3 mr-1" /> AI Advisor</TabsTrigger>
        </TabsList>

        {/* TASKS TAB */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">SEO Tasks</h2>
            <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-3 w-3 mr-1" /> Add Task</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create SEO Task</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Title *</Label><Input value={taskForm.task_title} onChange={e => setTaskForm({ ...taskForm, task_title: e.target.value })} /></div>
                  <div><Label>Category</Label>
                    <Select value={taskForm.task_category} onValueChange={v => setTaskForm({ ...taskForm, task_category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{TASK_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Priority</Label>
                    <Select value={taskForm.priority} onValueChange={v => setTaskForm({ ...taskForm, priority: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{TASK_PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Description</Label><Textarea value={taskForm.task_description} onChange={e => setTaskForm({ ...taskForm, task_description: e.target.value })} /></div>
                  <div><Label>Deadline</Label><Input type="date" value={taskForm.deadline} onChange={e => setTaskForm({ ...taskForm, deadline: e.target.value })} /></div>
                  <Button className="w-full" onClick={async () => {
                    if (!taskForm.task_title) return;
                    await createTask(taskForm);
                    setTaskOpen(false);
                    setTaskForm({ task_category: "TECHNICAL_SEO", task_title: "", task_description: "", priority: "MEDIUM", deadline: "" });
                  }}>Create Task</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Category summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TASK_CATEGORIES.map(cat => {
              const catTasks = tasks.filter(t => t.task_category === cat);
              const done = catTasks.filter(t => t.status === "COMPLETED").length;
              return (
                <Card key={cat} className="p-3">
                  <p className="text-xs font-medium text-muted-foreground">{cat.replace(/_/g, " ")}</p>
                  <p className="text-lg font-bold">{done}/{catTasks.length}</p>
                </Card>
              );
            })}
          </div>

          {tasksLoading ? <Skeleton className="h-24 w-full" /> : tasks.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No tasks yet. Add your first SEO task.</CardContent></Card>
          ) : (
            <Card><Table><TableHeader><TableRow>
              <TableHead>Task</TableHead><TableHead>Category</TableHead><TableHead>Priority</TableHead><TableHead>Deadline</TableHead><TableHead>Progress</TableHead><TableHead>Status</TableHead>
            </TableRow></TableHeader><TableBody>
              {tasks.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">{t.task_title}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{t.task_category.replace(/_/g, " ")}</Badge></TableCell>
                  <TableCell><Badge variant={t.priority === "HIGH" || t.priority === "URGENT" ? "destructive" : "secondary"} className="text-xs">{t.priority}</Badge></TableCell>
                  <TableCell className="text-sm">{t.deadline || "—"}</TableCell>
                  <TableCell><Progress value={t.progress_percent} className="w-16 h-2" /></TableCell>
                  <TableCell>
                    <Select value={t.status} onValueChange={v => updateTask(t.id, { status: v } as any)}>
                      <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{TASK_STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody></Table></Card>
          )}
        </TabsContent>

        {/* BLOGS TAB */}
        <TabsContent value="blogs" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Blog Content</h2>
            <Dialog open={blogOpen} onOpenChange={setBlogOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-3 w-3 mr-1" /> Add Blog</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create Blog Post</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Title *</Label><Input value={blogForm.blog_title} onChange={e => setBlogForm({ ...blogForm, blog_title: e.target.value })} /></div>
                  <div><Label>Topic</Label><Input value={blogForm.blog_topic} onChange={e => setBlogForm({ ...blogForm, blog_topic: e.target.value })} /></div>
                  <div><Label>Publish Date</Label><Input type="date" value={blogForm.publish_date} onChange={e => setBlogForm({ ...blogForm, publish_date: e.target.value })} /></div>
                  <Button className="w-full" onClick={async () => {
                    if (!blogForm.blog_title) return;
                    await createBlog(blogForm);
                    setBlogOpen(false);
                    setBlogForm({ blog_title: "", blog_topic: "", publish_date: "" });
                  }}>Create Blog</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {blogsLoading ? <Skeleton className="h-24 w-full" /> : blogs.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No blogs yet</CardContent></Card>
          ) : (
            <Card><Table><TableHeader><TableRow>
              <TableHead>Title</TableHead><TableHead>Topic</TableHead><TableHead>Score</TableHead><TableHead>Publish</TableHead><TableHead>Status</TableHead>
            </TableRow></TableHeader><TableBody>
              {blogs.map(b => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.blog_title}</TableCell>
                  <TableCell>{b.blog_topic || "—"}</TableCell>
                  <TableCell>{b.seo_score ?? "—"}</TableCell>
                  <TableCell>{b.publish_date || "—"}</TableCell>
                  <TableCell>
                    <Select value={b.status} onValueChange={v => updateBlog(b.id, { status: v } as any)}>
                      <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{["DRAFT", "WRITING", "REVIEW", "APPROVED", "PUBLISHED"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody></Table></Card>
          )}
        </TabsContent>

        {/* GMB TAB */}
        <TabsContent value="gmb" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Google Business Posts</h2>
            <Dialog open={gmbOpen} onOpenChange={setGmbOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-3 w-3 mr-1" /> Add Post</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create GMB Post</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Type</Label>
                    <Select value={gmbForm.post_type} onValueChange={v => setGmbForm({ ...gmbForm, post_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{["UPDATE", "OFFER", "EVENT", "PRODUCT"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Caption</Label><Textarea value={gmbForm.post_caption} onChange={e => setGmbForm({ ...gmbForm, post_caption: e.target.value })} /></div>
                  <div><Label>CTA Text</Label><Input value={gmbForm.cta_text} onChange={e => setGmbForm({ ...gmbForm, cta_text: e.target.value })} placeholder="Learn More" /></div>
                  <div><Label>Scheduled Date</Label><Input type="date" value={gmbForm.scheduled_date} onChange={e => setGmbForm({ ...gmbForm, scheduled_date: e.target.value })} /></div>
                  <Button className="w-full" onClick={async () => {
                    await createGmb(gmbForm);
                    setGmbOpen(false);
                    setGmbForm({ post_type: "UPDATE", post_caption: "", cta_text: "", scheduled_date: "" });
                  }}>Create Post</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {gmbLoading ? <Skeleton className="h-24 w-full" /> : gmbTasks.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No GMB posts yet. Each client requires 2 posts weekly.</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {gmbTasks.map(g => (
                <Card key={g.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <Badge variant="outline">{g.post_type}</Badge>
                      {statusBadge(g.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{g.post_caption || "No caption"}</p>
                    {g.cta_text && <p className="text-xs text-primary mt-1">CTA: {g.cta_text}</p>}
                    <p className="text-xs text-muted-foreground mt-2">📅 {g.scheduled_date || "Unscheduled"}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* SOCIAL TAB */}
        <TabsContent value="social" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Social Media</h2>
            <Dialog open={socialOpen} onOpenChange={setSocialOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-3 w-3 mr-1" /> Add Post</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create Social Post</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Platform</Label>
                    <Select value={socialForm.platform} onValueChange={v => setSocialForm({ ...socialForm, platform: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="FACEBOOK">Facebook</SelectItem><SelectItem value="INSTAGRAM">Instagram</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div><Label>Caption</Label><Textarea value={socialForm.post_caption} onChange={e => setSocialForm({ ...socialForm, post_caption: e.target.value })} /></div>
                  <div><Label>Hashtags</Label><Input value={socialForm.hashtags} onChange={e => setSocialForm({ ...socialForm, hashtags: e.target.value })} placeholder="#seo #marketing" /></div>
                  <div><Label>Post Date</Label><Input type="date" value={socialForm.post_date} onChange={e => setSocialForm({ ...socialForm, post_date: e.target.value })} /></div>
                  <Button className="w-full" onClick={async () => {
                    await createSocial(socialForm);
                    setSocialOpen(false);
                    setSocialForm({ platform: "FACEBOOK", post_caption: "", hashtags: "", post_date: "" });
                  }}>Create Post</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {socialLoading ? <Skeleton className="h-24 w-full" /> : socialTasks.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No social posts yet. 2 posts/month per platform required.</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {socialTasks.map(s => (
                <Card key={s.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        {s.platform === "FACEBOOK" ? <Facebook className="h-4 w-4 text-blue-600" /> : <Instagram className="h-4 w-4 text-pink-600" />}
                        <span className="text-sm font-medium">{s.platform}</span>
                      </div>
                      {statusBadge(s.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{s.post_caption || "No caption"}</p>
                    {s.hashtags && <p className="text-xs text-primary mt-1">{s.hashtags}</p>}
                    <p className="text-xs text-muted-foreground mt-2">📅 {s.post_date || "Unscheduled"}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* COMPETITORS TAB */}
        <TabsContent value="competitors" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Competitors ({competitors.length})</h2>
            <div className="flex gap-2">
              <Button size="sm" variant={competitors.length > 0 ? "outline" : "default"} disabled={fetchingCompetitors} onClick={async () => {
                if (!profile?.business_id || !projectId || !project?.website_domain) {
                  toast.error("Project domain required"); return;
                }
                setFetchingCompetitors(true);
                try {
                  const { data, error } = await supabase.functions.invoke("seo-competitor-fetch", {
                    body: { domain: project.website_domain, project_id: projectId, business_id: profile.business_id },
                  });
                  if (error) throw error;
                  toast.success(`Found ${data.total_found} competitors, ${data.new_inserted} new added`);
                  refetchCompetitors();
                } catch (e: any) {
                  toast.error(e.message || "Failed to fetch competitors");
                }
                setFetchingCompetitors(false);
              }}>
                <Globe className="h-3 w-3 mr-1" /> {fetchingCompetitors ? "Fetching..." : competitors.length > 0 ? "Refresh Competitors" : "Fetch Competitors"}
              </Button>
              <Dialog open={compOpen} onOpenChange={setCompOpen}>
                <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="h-3 w-3 mr-1" /> Add Manual</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Competitor</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Domain *</Label><Input value={compForm.competitor_domain} onChange={e => setCompForm({ ...compForm, competitor_domain: e.target.value })} placeholder="competitor.com" /></div>
                    <div><Label>Name</Label><Input value={compForm.competitor_name} onChange={e => setCompForm({ ...compForm, competitor_name: e.target.value })} /></div>
                    <Button className="w-full" onClick={async () => {
                      if (!compForm.competitor_domain) return;
                      await addCompetitor(compForm);
                      setCompOpen(false);
                      setCompForm({ competitor_domain: "", competitor_name: "" });
                    }}>Add Competitor</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          {competitors.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-200">
              Competitors already discovered. Click "Refresh Competitors" to update.
            </div>
          )}
          {compLoading ? <Skeleton className="h-24 w-full" /> : competitors.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No competitors tracked yet. Click "Fetch Competitors" to auto-discover top 30 from Google AU.</CardContent></Card>
          ) : (
            <Card><Table><TableHeader><TableRow>
              <TableHead>Domain</TableHead><TableHead>Name</TableHead><TableHead>Rank</TableHead><TableHead>Discovered</TableHead>
            </TableRow></TableHeader><TableBody>
              {competitors.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{(c as any).competitor_domain}</TableCell>
                  <TableCell>{(c as any).competitor_name || (c as any).competitor_title || "—"}</TableCell>
                  <TableCell>{(c as any).ranking_position || "—"}</TableCell>
                  <TableCell className="text-sm">{new Date(c.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody></Table></Card>
          )}
        </TabsContent>

        {/* UPDATES TAB */}
        <TabsContent value="updates" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Client Updates</h2>
            <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-3 w-3 mr-1" /> Post Update</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Post SEO Update</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Type</Label>
                    <Select value={updateForm.update_type} onValueChange={v => setUpdateForm({ ...updateForm, update_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{UPDATE_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Title *</Label><Input value={updateForm.title} onChange={e => setUpdateForm({ ...updateForm, title: e.target.value })} /></div>
                  <div><Label>Description</Label><Textarea value={updateForm.description} onChange={e => setUpdateForm({ ...updateForm, description: e.target.value })} /></div>
                  <Button className="w-full" onClick={async () => {
                    if (!updateForm.title) return;
                    await createUpdate(updateForm);
                    setUpdateOpen(false);
                    setUpdateForm({ update_type: "TECHNICAL_FIX", title: "", description: "" });
                  }}>Post Update</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {updLoading ? <Skeleton className="h-24 w-full" /> : updates.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No updates posted yet</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {updates.map(u => (
                <Card key={u.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">{u.update_type.replace(/_/g, " ")}</Badge>
                      {u.visible_to_client && <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">Client Visible</Badge>}
                      <span className="text-xs text-muted-foreground ml-auto">{new Date(u.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="font-medium">{u.title}</p>
                    {u.description && <p className="text-sm text-muted-foreground mt-1">{u.description}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* MESSAGES TAB */}
        <TabsContent value="messages" className="space-y-4">
          <h2 className="text-lg font-semibold">Client Communication</h2>
          <Card className="h-[400px] flex flex-col">
            <ScrollArea className="flex-1 p-4">
              {msgLoading ? <Skeleton className="h-24 w-full" /> : messages.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No messages yet. Start the conversation.</p>
              ) : (
                <div className="space-y-3">
                  {messages.map(m => (
                    <div key={m.id} className={`flex ${m.sent_by_role === "CLIENT" ? "justify-start" : "justify-end"}`}>
                      <div className={`max-w-[80%] rounded-lg p-3 ${m.sent_by_role === "CLIENT" ? "bg-secondary" : "bg-primary text-primary-foreground"}`}>
                        <p className="text-xs font-medium mb-1">{m.sent_by_role}</p>
                        <p className="text-sm">{m.message_text}</p>
                        <p className="text-[10px] opacity-60 mt-1">{new Date(m.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            <div className="border-t p-3 flex gap-2">
              <Input value={msgInput} onChange={e => setMsgInput(e.target.value)} placeholder="Type a message..." onKeyDown={e => { if (e.key === "Enter" && msgInput.trim()) { sendMessage({ message_text: msgInput }); setMsgInput(""); } }} />
              <Button size="icon" onClick={() => { if (msgInput.trim()) { sendMessage({ message_text: msgInput }); setMsgInput(""); } }}><Send className="h-4 w-4" /></Button>
            </div>
          </Card>
        </TabsContent>

        {/* REPORTS TAB */}
        <TabsContent value="reports" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Monthly Reports</h2>
            <Button size="sm" onClick={() => {
              const month = new Date().toISOString().slice(0, 7);
              generateReport(month, {
                tasks_completed: completedTasks,
                total_tasks: totalTasks,
                blogs_published: blogs.filter(b => b.status === "PUBLISHED").length,
                gmb_posts: gmbTasks.filter(g => g.status === "POSTED").length,
                competitors_tracked: competitors.length,
              }, project?.client_id || undefined);
            }}>
              <Sparkles className="h-3 w-3 mr-1" /> Generate This Month
            </Button>
          </div>
          {repLoading ? <Skeleton className="h-24 w-full" /> : reports.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No reports generated yet</CardContent></Card>
          ) : (
            <Card><Table><TableHeader><TableRow>
              <TableHead>Month</TableHead><TableHead>Generated</TableHead><TableHead>Data</TableHead>
            </TableRow></TableHeader><TableBody>
              {reports.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.report_month}</TableCell>
                  <TableCell>{new Date(r.generated_at).toLocaleDateString()}</TableCell>
                  <TableCell><pre className="text-xs max-w-[300px] truncate">{JSON.stringify(r.report_data_json)}</pre></TableCell>
                </TableRow>
              ))}
            </TableBody></Table></Card>
          )}
        </TabsContent>

        {/* PERFORMANCE TAB */}
        <TabsContent value="performance" className="space-y-4">
          <PerformanceDashboard clientId={project?.client_id} projectId={projectId} />
        </TabsContent>

        {/* MAPS PERFORMANCE TAB */}
        <TabsContent value="maps" className="space-y-4">
          {projectId && <MapsPerformancePanel projectId={projectId} />}
        </TabsContent>

        {/* INTEGRATIONS TAB */}
        <TabsContent value="integrations" className="space-y-4">
          {projectId && project?.business_id && (
            <ProjectIntegrationsTab projectId={projectId} businessId={project.business_id} />
          )}
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">AI SEO Advisor</h2>
            <Button size="sm" disabled={generating} onClick={() => generateRecommendations({
              project_name: project?.project_name,
              domain: project?.website_domain,
              location: project?.target_location,
              primary_keyword: project?.primary_keyword,
              tasks_completed: completedTasks,
              total_tasks: totalTasks,
              blogs_count: blogs.length,
              competitors_count: competitors.length,
            })}>
              <Brain className="h-3 w-3 mr-1" /> {generating ? "Generating..." : "Get AI Recommendations"}
            </Button>
          </div>
          {recLoading ? <Skeleton className="h-24 w-full" /> : recommendations.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p>Click "Get AI Recommendations" to analyze your project and receive actionable insights.</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {recommendations.map(r => (
                <Card key={r.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">{r.recommendation_type}</Badge>
                      <Badge variant={r.priority === "HIGH" ? "destructive" : "secondary"} className="text-xs">{r.priority}</Badge>
                      {statusBadge(r.status)}
                      <div className="ml-auto flex gap-1">
                        {r.status === "PENDING" && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => updateRecStatus(r.id, "ACCEPTED")}>Accept</Button>
                            <Button size="sm" variant="ghost" onClick={() => updateRecStatus(r.id, "DISMISSED")}>Dismiss</Button>
                          </>
                        )}
                      </div>
                    </div>
                    <p className="font-medium">{r.title}</p>
                    {r.description && <p className="text-sm text-muted-foreground mt-1">{r.description}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SeoProjectDetailPage;
