import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSeoProjects } from "@/hooks/useSeoProjects";
import { useSeoRankChecks } from "@/hooks/useSeoRankChecks";
import { useSeoBacklinks, LINK_TYPES, BACKLINK_STATUSES } from "@/hooks/useSeoBacklinks";
import { useSeoContentGeneration, CONTENT_TYPES, TONES, CONTENT_STATUSES } from "@/hooks/useSeoContentGeneration";
import { useSeoPageScores } from "@/hooks/useSeoPageScores";
import { useSeoCompetitorGap, GAP_TYPES } from "@/hooks/useSeoCompetitorGap";
import { useSeoCompetitors } from "@/hooks/useSeoCompetitors";
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
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, Plus, TrendingUp, TrendingDown, Link2, FileText, BarChart3,
  Target, Sparkles, Search, Loader2,
} from "lucide-react";

const SeoIntelligencePage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { projects } = useSeoProjects();
  const project = projects.find(p => p.id === projectId);

  const { checks, loading: ranksLoading, addCheck } = useSeoRankChecks(projectId);
  const { backlinks, loading: blLoading, addBacklink, updateBacklink } = useSeoBacklinks(projectId);
  const { items: contentItems, loading: ctLoading, generating, generate, updateItem } = useSeoContentGeneration(projectId);
  const { scores, loading: scLoading, scanning, scanPage } = useSeoPageScores(projectId);
  const { gaps, loading: gapLoading, analyzing, analyzeGaps } = useSeoCompetitorGap(projectId);
  const { competitors } = useSeoCompetitors(projectId);

  // Form states
  const [rankForm, setRankForm] = useState({ keyword: "", rank_position: "", location: "", device_type: "desktop" });
  const [blForm, setBlForm] = useState({ source_url: "", target_url: "", anchor_text: "", link_type: "DOFOLLOW" });
  const [contentForm, setContentForm] = useState({ content_type: "BLOG", title: "", target_keyword: "", tone: "professional" });
  const [scanUrl, setScanUrl] = useState("");
  const [scanKeyword, setScanKeyword] = useState("");
  const [rankOpen, setRankOpen] = useState(false);
  const [blOpen, setBlOpen] = useState(false);
  const [contentOpen, setContentOpen] = useState(false);

  const scoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-destructive";
  };

  // Stats
  const activeBacklinks = backlinks.filter(b => b.status === "ACTIVE").length;
  const lostBacklinks = backlinks.filter(b => b.status === "LOST").length;
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, s) => a + s.seo_score, 0) / scores.length) : 0;
  const highOppGaps = gaps.filter(g => (g.opportunity_score || 0) >= 70).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/seo-ops/${projectId}`)}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold">SEO Intelligence</h1>
          <p className="text-sm text-muted-foreground">{project?.project_name} — {project?.website_domain}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Rank Checks</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{checks.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Active Backlinks</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-green-600">{activeBacklinks}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Lost Backlinks</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-destructive">{lostBacklinks}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Avg SEO Score</CardTitle></CardHeader><CardContent><p className={`text-2xl font-bold ${scoreColor(avgScore)}`}>{avgScore}/100</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">High Opportunities</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-primary">{highOppGaps}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="rankings">
        <TabsList className="flex-wrap">
          <TabsTrigger value="rankings"><TrendingUp className="h-3 w-3 mr-1" /> Rankings</TabsTrigger>
          <TabsTrigger value="backlinks"><Link2 className="h-3 w-3 mr-1" /> Backlinks</TabsTrigger>
          <TabsTrigger value="content"><FileText className="h-3 w-3 mr-1" /> AI Content</TabsTrigger>
          <TabsTrigger value="scores"><BarChart3 className="h-3 w-3 mr-1" /> Page Scores</TabsTrigger>
          <TabsTrigger value="gaps"><Target className="h-3 w-3 mr-1" /> Competitor Gap</TabsTrigger>
        </TabsList>

        {/* RANKINGS TAB */}
        <TabsContent value="rankings" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Google Rank Checks</h2>
            <Dialog open={rankOpen} onOpenChange={setRankOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-3 w-3 mr-1" /> Add Check</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Record Rank Check</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Keyword *</Label><Input value={rankForm.keyword} onChange={e => setRankForm({ ...rankForm, keyword: e.target.value })} /></div>
                  <div><Label>Position</Label><Input type="number" value={rankForm.rank_position} onChange={e => setRankForm({ ...rankForm, rank_position: e.target.value })} /></div>
                  <div><Label>Location</Label><Input value={rankForm.location} onChange={e => setRankForm({ ...rankForm, location: e.target.value })} placeholder="Brisbane, QLD" /></div>
                  <div><Label>Device</Label>
                    <Select value={rankForm.device_type} onValueChange={v => setRankForm({ ...rankForm, device_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="desktop">Desktop</SelectItem><SelectItem value="mobile">Mobile</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full" onClick={async () => {
                    if (!rankForm.keyword) return;
                    await addCheck({ keyword: rankForm.keyword, rank_position: rankForm.rank_position ? parseInt(rankForm.rank_position) : undefined, location: rankForm.location || undefined, device_type: rankForm.device_type });
                    setRankOpen(false);
                    setRankForm({ keyword: "", rank_position: "", location: "", device_type: "desktop" });
                  }}>Save</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {ranksLoading ? <Skeleton className="h-24 w-full" /> : checks.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No rank checks recorded yet</CardContent></Card>
          ) : (
            <Card><Table><TableHeader><TableRow>
              <TableHead>Keyword</TableHead><TableHead>Position</TableHead><TableHead>Location</TableHead><TableHead>Device</TableHead><TableHead>URL Found</TableHead><TableHead>Date</TableHead>
            </TableRow></TableHeader><TableBody>
              {checks.slice(0, 100).map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.keyword}</TableCell>
                  <TableCell><Badge variant={c.rank_position && c.rank_position <= 10 ? "default" : "secondary"}>#{c.rank_position || "—"}</Badge></TableCell>
                  <TableCell className="text-sm">{c.location || "—"}</TableCell>
                  <TableCell className="text-xs">{c.device_type}</TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate">{c.url_found || "—"}</TableCell>
                  <TableCell className="text-sm">{c.search_date}</TableCell>
                </TableRow>
              ))}
            </TableBody></Table></Card>
          )}
        </TabsContent>

        {/* BACKLINKS TAB */}
        <TabsContent value="backlinks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Backlink Monitor</h2>
            <Dialog open={blOpen} onOpenChange={setBlOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-3 w-3 mr-1" /> Add Backlink</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Backlink</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Source URL *</Label><Input value={blForm.source_url} onChange={e => setBlForm({ ...blForm, source_url: e.target.value })} placeholder="https://example.com/article" /></div>
                  <div><Label>Target URL</Label><Input value={blForm.target_url} onChange={e => setBlForm({ ...blForm, target_url: e.target.value })} /></div>
                  <div><Label>Anchor Text</Label><Input value={blForm.anchor_text} onChange={e => setBlForm({ ...blForm, anchor_text: e.target.value })} /></div>
                  <div><Label>Link Type</Label>
                    <Select value={blForm.link_type} onValueChange={v => setBlForm({ ...blForm, link_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{LINK_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full" onClick={async () => {
                    if (!blForm.source_url) return;
                    await addBacklink(blForm);
                    setBlOpen(false);
                    setBlForm({ source_url: "", target_url: "", anchor_text: "", link_type: "DOFOLLOW" });
                  }}>Add</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {blLoading ? <Skeleton className="h-24 w-full" /> : backlinks.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No backlinks tracked yet</CardContent></Card>
          ) : (
            <Card><Table><TableHeader><TableRow>
              <TableHead>Source</TableHead><TableHead>Target</TableHead><TableHead>Anchor</TableHead><TableHead>Type</TableHead><TableHead>DA</TableHead><TableHead>Status</TableHead>
            </TableRow></TableHeader><TableBody>
              {backlinks.map(b => (
                <TableRow key={b.id}>
                  <TableCell className="text-xs max-w-[200px] truncate">{b.source_url}</TableCell>
                  <TableCell className="text-xs max-w-[150px] truncate">{b.target_url || "—"}</TableCell>
                  <TableCell className="text-sm">{b.anchor_text || "—"}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{b.link_type}</Badge></TableCell>
                  <TableCell>{b.domain_authority || "—"}</TableCell>
                  <TableCell>
                    <Select value={b.status} onValueChange={v => updateBacklink(b.id, { status: v })}>
                      <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{BACKLINK_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody></Table></Card>
          )}
        </TabsContent>

        {/* AI CONTENT TAB */}
        <TabsContent value="content" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">AI Content Generator</h2>
            <Dialog open={contentOpen} onOpenChange={setContentOpen}>
              <DialogTrigger asChild><Button size="sm"><Sparkles className="h-3 w-3 mr-1" /> Generate Content</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Generate SEO Content</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Content Type</Label>
                    <Select value={contentForm.content_type} onValueChange={v => setContentForm({ ...contentForm, content_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CONTENT_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Title *</Label><Input value={contentForm.title} onChange={e => setContentForm({ ...contentForm, title: e.target.value })} placeholder="Best Plumber in Brisbane" /></div>
                  <div><Label>Target Keyword</Label><Input value={contentForm.target_keyword} onChange={e => setContentForm({ ...contentForm, target_keyword: e.target.value })} /></div>
                  <div><Label>Tone</Label>
                    <Select value={contentForm.tone} onValueChange={v => setContentForm({ ...contentForm, tone: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{TONES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full" disabled={generating} onClick={async () => {
                    if (!contentForm.title) return;
                    await generate(contentForm);
                    setContentOpen(false);
                    setContentForm({ content_type: "BLOG", title: "", target_keyword: "", tone: "professional" });
                  }}>{generating ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Generating...</> : "Generate"}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {ctLoading ? <Skeleton className="h-24 w-full" /> : contentItems.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No AI-generated content yet. Click Generate to start.</CardContent></Card>
          ) : (
            <div className="space-y-4">
              {contentItems.map(item => (
                <Card key={item.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{item.title}</CardTitle>
                        <p className="text-xs text-muted-foreground">{item.content_type.replace(/_/g, " ")} · {item.target_keyword || "No keyword"} · {item.tone}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.seo_score && <Badge variant="outline" className={scoreColor(item.seo_score)}>{item.seo_score}/100</Badge>}
                        <Select value={item.status} onValueChange={v => updateItem(item.id, { status: v })}>
                          <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{CONTENT_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  {item.generated_content && (
                    <CardContent>
                      <div className="bg-muted/50 rounded p-3 max-h-48 overflow-y-auto text-sm whitespace-pre-wrap">{item.generated_content.slice(0, 1000)}{item.generated_content.length > 1000 ? "..." : ""}</div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* PAGE SCORES TAB */}
        <TabsContent value="scores" className="space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h2 className="text-lg font-semibold">Page SEO Scores</h2>
            <div className="flex items-center gap-2">
              <Input value={scanUrl} onChange={e => setScanUrl(e.target.value)} placeholder="https://example.com/page" className="w-60" />
              <Input value={scanKeyword} onChange={e => setScanKeyword(e.target.value)} placeholder="Keyword" className="w-40" />
              <Button size="sm" disabled={scanning || !scanUrl} onClick={() => { scanPage(scanUrl, scanKeyword); setScanUrl(""); setScanKeyword(""); }}>
                {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-3 w-3 mr-1" /> Scan</>}
              </Button>
            </div>
          </div>
          {scLoading ? <Skeleton className="h-24 w-full" /> : scores.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No pages scored yet. Enter a URL above to scan.</CardContent></Card>
          ) : (
            <Card><Table><TableHeader><TableRow>
              <TableHead>Page</TableHead><TableHead>SEO Score</TableHead><TableHead>Technical</TableHead><TableHead>Meta</TableHead><TableHead>Content</TableHead><TableHead>Local</TableHead><TableHead>Scanned</TableHead>
            </TableRow></TableHeader><TableBody>
              {scores.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="max-w-[250px] truncate text-sm">{s.page_url}</TableCell>
                  <TableCell><span className={`font-bold ${scoreColor(s.seo_score)}`}>{s.seo_score}/100</span></TableCell>
                  <TableCell>{s.technical_score ?? "—"}</TableCell>
                  <TableCell>{s.meta_score ?? "—"}</TableCell>
                  <TableCell>{s.content_score ?? "—"}</TableCell>
                  <TableCell>{s.local_seo_score ?? "—"}</TableCell>
                  <TableCell className="text-xs">{s.last_scanned_at ? new Date(s.last_scanned_at).toLocaleDateString() : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody></Table></Card>
          )}
        </TabsContent>

        {/* COMPETITOR GAP TAB */}
        <TabsContent value="gaps" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Competitor Gap Analysis</h2>
            {competitors.length > 0 && (
              <Button size="sm" disabled={analyzing} onClick={() => analyzeGaps({ competitor_id: competitors[0]?.id, competitor_domain: competitors[0]?.competitor_domain, client_domain: project?.website_domain })}>
                {analyzing ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Analyzing...</> : <><Target className="h-3 w-3 mr-1" /> Analyze Gaps</>}
              </Button>
            )}
          </div>
          {competitors.length === 0 && (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Add competitors in the project detail page first</CardContent></Card>
          )}
          {gapLoading ? <Skeleton className="h-24 w-full" /> : gaps.length === 0 ? (
            competitors.length > 0 && <Card><CardContent className="py-8 text-center text-muted-foreground">No gaps analyzed yet. Click Analyze to start.</CardContent></Card>
          ) : (
            <Card><Table><TableHeader><TableRow>
              <TableHead>Keyword</TableHead><TableHead>Gap Type</TableHead><TableHead>Client Rank</TableHead><TableHead>Competitor Rank</TableHead><TableHead>Opportunity</TableHead><TableHead>Recommendation</TableHead>
            </TableRow></TableHeader><TableBody>
              {gaps.map(g => (
                <TableRow key={g.id}>
                  <TableCell className="font-medium">{g.keyword || "—"}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{g.gap_type.replace(/_/g, " ")}</Badge></TableCell>
                  <TableCell>{g.client_rank ?? "—"}</TableCell>
                  <TableCell>{g.competitor_rank ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={g.opportunity_score || 0} className="w-16 h-2" />
                      <span className="text-sm">{g.opportunity_score || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs max-w-[250px]">{g.recommendation || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody></Table></Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SeoIntelligencePage;
