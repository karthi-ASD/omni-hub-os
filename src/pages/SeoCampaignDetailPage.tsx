import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSeoKeywords, useSeoOnpageTasks, useSeoOffpageItems, useSeoContent } from "@/hooks/useSeo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, ArrowLeft, Key, FileText, Link, Globe } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const SeoCampaignDetailPage = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const { keywords, loading: kwLoading, addKeyword, updateKeywordStatus } = useSeoKeywords(campaignId);
  const { tasks, loading: taskLoading, addTask, updateTaskStatus } = useSeoOnpageTasks(campaignId);
  const { items: offpageItems, loading: offLoading, addItem, updateItemStatus } = useSeoOffpageItems(campaignId);
  const { content, loading: contentLoading, addContent, updateContentStatus } = useSeoContent(campaignId);

  // Keyword form
  const [kwOpen, setKwOpen] = useState(false);
  const [kwForm, setKwForm] = useState({ keyword: "", keyword_type: "primary", priority: "medium", target_url: "" });

  // Task form
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({ page_url: "", checklist_item: "" });

  // Offpage form
  const [offOpen, setOffOpen] = useState(false);
  const [offForm, setOffForm] = useState({ type: "citation", source_url: "", target_url: "" });

  // Content form
  const [contentOpen, setContentOpen] = useState(false);
  const [contentForm, setContentForm] = useState({ type: "blog", title: "", brief: "", target_url: "" });

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      planned: "bg-muted text-muted-foreground", active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      dropped: "bg-destructive/10 text-destructive", todo: "bg-muted text-muted-foreground",
      in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      done: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      needs_client_approval: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      submitted: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      live: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      rejected: "bg-destructive/10 text-destructive",
      briefed: "bg-muted text-muted-foreground", writing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      review: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      client_approval: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      published: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    };
    return <Badge className={colors[status] || ""} variant="secondary">{status.replace(/_/g, " ")}</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/seo")}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold">Campaign Detail</h1>
          <p className="text-muted-foreground font-mono text-sm">{campaignId?.slice(0, 8)}…</p>
        </div>
      </div>

      <Tabs defaultValue="keywords">
        <TabsList className="flex-wrap">
          <TabsTrigger value="keywords"><Key className="h-3 w-3 mr-1" /> Keywords</TabsTrigger>
          <TabsTrigger value="onpage"><FileText className="h-3 w-3 mr-1" /> On-Page</TabsTrigger>
          <TabsTrigger value="offpage"><Link className="h-3 w-3 mr-1" /> Off-Page</TabsTrigger>
          <TabsTrigger value="content"><Globe className="h-3 w-3 mr-1" /> Content</TabsTrigger>
        </TabsList>

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
                      <SelectContent>
                        {["primary", "service", "location", "blog"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Priority</Label>
                    <Select value={kwForm.priority} onValueChange={(v) => setKwForm({ ...kwForm, priority: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["low", "medium", "high"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Target URL</Label><Input value={kwForm.target_url} onChange={(e) => setKwForm({ ...kwForm, target_url: e.target.value })} /></div>
                  <Button className="w-full" onClick={async () => { await addKeyword(kwForm); setKwOpen(false); setKwForm({ keyword: "", keyword_type: "primary", priority: "medium", target_url: "" }); }}>Add Keyword</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {kwLoading ? <Skeleton className="h-24 w-full" /> : keywords.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No keywords yet</CardContent></Card>
          ) : (
            <Card><Table><TableHeader><TableRow>
              <TableHead>Keyword</TableHead><TableHead>Type</TableHead><TableHead>Priority</TableHead><TableHead>Target</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
            </TableRow></TableHeader><TableBody>
              {keywords.map((kw) => (
                <TableRow key={kw.id}>
                  <TableCell className="font-medium">{kw.keyword}</TableCell>
                  <TableCell className="capitalize">{kw.keyword_type}</TableCell>
                  <TableCell className="capitalize">{kw.priority}</TableCell>
                  <TableCell className="truncate max-w-[150px]">{kw.target_url || "—"}</TableCell>
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
            <Card><CardContent className="py-8 text-center text-muted-foreground">No on-page tasks yet</CardContent></Card>
          ) : (
            <Card><Table><TableHeader><TableRow>
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
            <h2 className="text-lg font-semibold">Off-Page ({offpageItems.length})</h2>
            <Dialog open={offOpen} onOpenChange={setOffOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-3 w-3 mr-1" /> Add</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Off-Page Item</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Type</Label>
                    <Select value={offForm.type} onValueChange={(v) => setOffForm({ ...offForm, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{["citation", "backlink", "guest_post", "profile", "directory"].map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Source URL</Label><Input value={offForm.source_url} onChange={(e) => setOffForm({ ...offForm, source_url: e.target.value })} /></div>
                  <div><Label>Target URL</Label><Input value={offForm.target_url} onChange={(e) => setOffForm({ ...offForm, target_url: e.target.value })} /></div>
                  <Button className="w-full" onClick={async () => { await addItem(offForm); setOffOpen(false); setOffForm({ type: "citation", source_url: "", target_url: "" }); }}>Add Item</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {offLoading ? <Skeleton className="h-24 w-full" /> : offpageItems.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No off-page items yet</CardContent></Card>
          ) : (
            <Card><Table><TableHeader><TableRow>
              <TableHead>Type</TableHead><TableHead>Source</TableHead><TableHead>Target</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
            </TableRow></TableHeader><TableBody>
              {offpageItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="capitalize">{item.type.replace(/_/g, " ")}</TableCell>
                  <TableCell className="truncate max-w-[150px]">{item.source_url || "—"}</TableCell>
                  <TableCell className="truncate max-w-[150px]">{item.target_url || "—"}</TableCell>
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
                      <SelectContent>{["service_page", "location_page", "blog", "landing_page"].map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Title</Label><Input value={contentForm.title} onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })} /></div>
                  <div><Label>Brief</Label><Input value={contentForm.brief} onChange={(e) => setContentForm({ ...contentForm, brief: e.target.value })} /></div>
                  <div><Label>Target URL</Label><Input value={contentForm.target_url} onChange={(e) => setContentForm({ ...contentForm, target_url: e.target.value })} /></div>
                  <Button className="w-full" onClick={async () => { if (!contentForm.title) return; await addContent(contentForm); setContentOpen(false); setContentForm({ type: "blog", title: "", brief: "", target_url: "" }); }}>Add Content</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {contentLoading ? <Skeleton className="h-24 w-full" /> : content.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No content items yet</CardContent></Card>
          ) : (
            <Card><Table><TableHeader><TableRow>
              <TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Target URL</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
            </TableRow></TableHeader><TableBody>
              {content.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.title}</TableCell>
                  <TableCell className="capitalize">{c.type.replace(/_/g, " ")}</TableCell>
                  <TableCell className="truncate max-w-[150px]">{c.target_url || "—"}</TableCell>
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
      </Tabs>
    </div>
  );
};

export default SeoCampaignDetailPage;
