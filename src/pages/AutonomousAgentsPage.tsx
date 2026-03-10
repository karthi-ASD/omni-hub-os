import { useState } from "react";
import { useAutonomousAgents } from "@/hooks/useAutonomousAgents";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { HelpTooltip } from "@/components/HelpTooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Bot, Search, FileText, PenTool, Link2, Share2, Eye, Activity, Play, ThumbsUp } from "lucide-react";

const severityColors: Record<string, string> = { low: "bg-muted text-muted-foreground", medium: "bg-blue-500/20 text-blue-400", high: "bg-orange-500/20 text-orange-400", critical: "bg-destructive/20 text-destructive" };
const statusColors: Record<string, string> = { draft: "bg-muted text-muted-foreground", generated: "bg-blue-500/20 text-blue-400", approved: "bg-green-500/20 text-green-400", published: "bg-primary/20 text-primary", identified: "bg-purple-500/20 text-purple-400", contacted: "bg-yellow-500/20 text-yellow-400", completed: "bg-green-500/20 text-green-400" };

const AutonomousAgentsPage = () => {
  usePageTitle("Autonomous Agency");
  const { audits, clusters, briefs, drafts, prospects, socialPosts, competitors, logs, loading, runSeoAudit, generateKeywordClusters, generateContentBrief, generateBlogDraft, findOutreachProspects, generateSocialPosts, analyzeCompetitor, approveDraft, updateStatus } = useAutonomousAgents();
  const [auditForm, setAuditForm] = useState({ domain: "", client_id: "" });
  const [kwForm, setKwForm] = useState({ business_niche: "", location: "" });
  const [briefForm, setBriefForm] = useState({ target_keyword: "", brief_type: "service_page" });
  const [draftForm, setDraftForm] = useState({ target_keyword: "", tone: "professional", word_count: 1200 });
  const [outreachForm, setOutreachForm] = useState({ niche: "", target_url: "" });
  const [socialForm, setSocialForm] = useState({ platform: "facebook", content_type: "promotional", topic: "" });
  const [compForm, setCompForm] = useState({ competitor_domain: "", client_domain: "" });
  const [running, setRunning] = useState("");
  const run = async (key: string, fn: () => Promise<any>) => { setRunning(key); try { await fn(); } finally { setRunning(""); } };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <Bot className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Autonomous Agency</h1>
        <HelpTooltip label="Autonomous Agency" description="AI-powered execution engine for SEO audits, keyword clusters, content briefs, blog drafts, outreach, social posts, and competitor analysis." />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {[{ label: "Audits", value: audits.length, icon: Search }, { label: "Clusters", value: clusters.length, icon: FileText }, { label: "Briefs", value: briefs.length, icon: FileText }, { label: "Drafts", value: drafts.length, icon: PenTool }, { label: "Prospects", value: prospects.length, icon: Link2 }, { label: "Social", value: socialPosts.length, icon: Share2 }, { label: "Competitors", value: competitors.length, icon: Eye }, { label: "Logs", value: logs.length, icon: Activity }].map(s => (
          <Card key={s.label} className="border-border"><CardContent className="py-3 text-center"><s.icon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" /><p className="text-lg font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></CardContent></Card>
        ))}
      </div>
      <Tabs defaultValue="audit" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="audit">SEO Audit</TabsTrigger><TabsTrigger value="keywords">Keywords</TabsTrigger><TabsTrigger value="briefs">Briefs</TabsTrigger><TabsTrigger value="drafts">Drafts</TabsTrigger><TabsTrigger value="outreach">Outreach</TabsTrigger><TabsTrigger value="social">Social</TabsTrigger><TabsTrigger value="competitor">Competitors</TabsTrigger><TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>
        <TabsContent value="audit" className="space-y-4">
          <Card className="border-border"><CardHeader><CardTitle className="text-sm">Run SEO Audit</CardTitle></CardHeader><CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div><Label>Website Domain</Label><Input value={auditForm.domain} onChange={e => setAuditForm({ ...auditForm, domain: e.target.value })} placeholder="example.com" /></div><div><Label>Client ID (optional)</Label><Input value={auditForm.client_id} onChange={e => setAuditForm({ ...auditForm, client_id: e.target.value })} placeholder="UUID" /></div></div>
            <Button onClick={() => run("audit", () => runSeoAudit(auditForm))} disabled={!auditForm.domain || running === "audit"}><Play className="h-4 w-4 mr-2" />{running === "audit" ? "Scanning…" : "Run Audit"}</Button>
          </CardContent></Card>
          {audits.map(a => (<Card key={a.id} className="border-border"><CardContent className="py-4"><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><Badge variant="outline" className="bg-primary/20 text-primary">Score: {a.health_score}</Badge><Badge variant="outline">{a.total_issues} issues</Badge>{a.critical_issues > 0 && <Badge variant="outline" className="bg-destructive/20 text-destructive">{a.critical_issues} critical</Badge>}</div><span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span></div>{Array.isArray(a.issues_json) && a.issues_json.slice(0, 5).map((issue: any, i: number) => (<div key={i} className="flex items-center gap-2 text-sm py-1 border-t border-border"><Badge variant="outline" className={severityColors[issue.severity] || ""}>{issue.severity}</Badge><span>{issue.issue}</span></div>))}</CardContent></Card>))}
        </TabsContent>
        <TabsContent value="keywords" className="space-y-4">
          <Card className="border-border"><CardHeader><CardTitle className="text-sm">Generate Keyword Clusters</CardTitle></CardHeader><CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div><Label>Business Niche</Label><Input value={kwForm.business_niche} onChange={e => setKwForm({ ...kwForm, business_niche: e.target.value })} placeholder="e.g., Bathroom Renovation" /></div><div><Label>Location</Label><Input value={kwForm.location} onChange={e => setKwForm({ ...kwForm, location: e.target.value })} placeholder="e.g., Brisbane" /></div></div>
            <Button onClick={() => run("kw", () => generateKeywordClusters(kwForm))} disabled={!kwForm.business_niche || running === "kw"}><Play className="h-4 w-4 mr-2" />{running === "kw" ? "Generating…" : "Generate Clusters"}</Button>
          </CardContent></Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{clusters.map(c => (<Card key={c.id} className="border-border"><CardContent className="py-4"><div className="flex items-center gap-2 mb-2"><p className="font-medium text-sm">{c.cluster_name}</p><Badge variant="outline">{c.cluster_type}</Badge><Badge variant="outline" className={statusColors[c.status] || ""}>{c.status}</Badge></div>{c.primary_keyword && <p className="text-xs text-muted-foreground">Primary: {c.primary_keyword}</p>}{Array.isArray(c.keywords_json) && <p className="text-xs text-muted-foreground mt-1">{c.keywords_json.slice(0, 5).join(", ")}</p>}</CardContent></Card>))}</div>
        </TabsContent>
        <TabsContent value="briefs" className="space-y-4">
          <Card className="border-border"><CardHeader><CardTitle className="text-sm">Generate Content Brief</CardTitle></CardHeader><CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div><Label>Target Keyword</Label><Input value={briefForm.target_keyword} onChange={e => setBriefForm({ ...briefForm, target_keyword: e.target.value })} placeholder="bathroom renovation brisbane" /></div><div><Label>Brief Type</Label><Select value={briefForm.brief_type} onValueChange={v => setBriefForm({ ...briefForm, brief_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="service_page">Service Page</SelectItem><SelectItem value="location_page">Location Page</SelectItem><SelectItem value="blog_article">Blog Article</SelectItem><SelectItem value="comparison_page">Comparison Page</SelectItem><SelectItem value="faq_page">FAQ Page</SelectItem></SelectContent></Select></div></div>
            <Button onClick={() => run("brief", () => generateContentBrief(briefForm))} disabled={!briefForm.target_keyword || running === "brief"}><Play className="h-4 w-4 mr-2" />{running === "brief" ? "Generating…" : "Generate Brief"}</Button>
          </CardContent></Card>
          {briefs.map(b => (<Card key={b.id} className="border-border"><CardContent className="py-4"><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><p className="font-medium text-sm">{b.recommended_title || b.target_keyword}</p><Badge variant="outline">{b.brief_type}</Badge><Badge variant="outline" className={statusColors[b.status] || ""}>{b.status}</Badge></div><Button size="sm" variant="outline" onClick={() => approveDraft(b.id, "ai_content_briefs")} disabled={b.status === "approved"}><ThumbsUp className="h-3 w-3 mr-1" />Approve</Button></div><p className="text-xs text-muted-foreground">Word count: {b.word_count_recommendation} · Intent: {b.search_intent}</p></CardContent></Card>))}
        </TabsContent>
        <TabsContent value="drafts" className="space-y-4">
          <Card className="border-border"><CardHeader><CardTitle className="text-sm">Generate Blog Draft</CardTitle></CardHeader><CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3"><div><Label>Target Keyword</Label><Input value={draftForm.target_keyword} onChange={e => setDraftForm({ ...draftForm, target_keyword: e.target.value })} placeholder="bathroom renovation brisbane" /></div><div><Label>Tone</Label><Select value={draftForm.tone} onValueChange={v => setDraftForm({ ...draftForm, tone: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="professional">Professional</SelectItem><SelectItem value="friendly">Friendly</SelectItem><SelectItem value="authoritative">Authoritative</SelectItem><SelectItem value="conversational">Conversational</SelectItem></SelectContent></Select></div><div><Label>Word Count</Label><Input type="number" value={draftForm.word_count} onChange={e => setDraftForm({ ...draftForm, word_count: parseInt(e.target.value) || 1200 })} /></div></div>
            <Button onClick={() => run("draft", () => generateBlogDraft(draftForm))} disabled={!draftForm.target_keyword || running === "draft"}><Play className="h-4 w-4 mr-2" />{running === "draft" ? "Drafting…" : "Generate Draft"}</Button>
          </CardContent></Card>
          {drafts.map(d => (<Card key={d.id} className="border-border"><CardContent className="py-4"><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><p className="font-medium text-sm">{d.title}</p><Badge variant="outline" className={statusColors[d.status] || ""}>{d.status}</Badge><Badge variant="outline">{d.word_count} words</Badge></div><div className="flex gap-1"><Dialog><DialogTrigger asChild><Button size="sm" variant="outline"><Eye className="h-3 w-3 mr-1" />Preview</Button></DialogTrigger><DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto"><DialogHeader><DialogTitle>{d.title}</DialogTitle></DialogHeader><div className="space-y-2">{d.meta_title && <p className="text-xs text-muted-foreground">Meta: {d.meta_title}</p>}{d.meta_description && <p className="text-xs text-muted-foreground">{d.meta_description}</p>}<div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm">{d.content}</div></div></DialogContent></Dialog><Button size="sm" variant="outline" onClick={() => approveDraft(d.id, "ai_blog_drafts")} disabled={d.status === "approved"}><ThumbsUp className="h-3 w-3 mr-1" />Approve</Button></div></div></CardContent></Card>))}
        </TabsContent>
        <TabsContent value="outreach" className="space-y-4">
          <Card className="border-border"><CardHeader><CardTitle className="text-sm">Find Outreach Prospects</CardTitle></CardHeader><CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div><Label>Niche / Industry</Label><Input value={outreachForm.niche} onChange={e => setOutreachForm({ ...outreachForm, niche: e.target.value })} placeholder="e.g., home renovation" /></div><div><Label>Target URL</Label><Input value={outreachForm.target_url} onChange={e => setOutreachForm({ ...outreachForm, target_url: e.target.value })} placeholder="https://client.com/service-page" /></div></div>
            <Button onClick={() => run("outreach", () => findOutreachProspects(outreachForm))} disabled={!outreachForm.niche || running === "outreach"}><Play className="h-4 w-4 mr-2" />{running === "outreach" ? "Finding…" : "Find Prospects"}</Button>
          </CardContent></Card>
          {prospects.map(p => (<Card key={p.id} className="border-border"><CardContent className="py-3 flex items-center justify-between"><div><p className="text-sm font-medium">{p.prospect_domain}</p><div className="flex gap-2 mt-1"><Badge variant="outline">{p.outreach_category}</Badge><Badge variant="outline" className={statusColors[p.outreach_status] || ""}>{p.outreach_status}</Badge><span className="text-xs text-muted-foreground">Quality: {p.domain_quality_score}/100</span></div></div><Button size="sm" variant="outline" onClick={() => updateStatus(p.id, "ai_outreach_prospects", "contacted")}>Mark Contacted</Button></CardContent></Card>))}
        </TabsContent>
        <TabsContent value="social" className="space-y-4">
          <Card className="border-border"><CardHeader><CardTitle className="text-sm">Generate Social Posts</CardTitle></CardHeader><CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3"><div><Label>Platform</Label><Select value={socialForm.platform} onValueChange={v => setSocialForm({ ...socialForm, platform: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="facebook">Facebook</SelectItem><SelectItem value="instagram">Instagram</SelectItem><SelectItem value="linkedin">LinkedIn</SelectItem><SelectItem value="twitter">X / Twitter</SelectItem><SelectItem value="gbp">Google Business</SelectItem></SelectContent></Select></div><div><Label>Content Type</Label><Select value={socialForm.content_type} onValueChange={v => setSocialForm({ ...socialForm, content_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="promotional">Promotional</SelectItem><SelectItem value="blog_promotion">Blog Promo</SelectItem><SelectItem value="service_spotlight">Service Spotlight</SelectItem><SelectItem value="testimonial">Testimonial</SelectItem><SelectItem value="seasonal">Seasonal</SelectItem></SelectContent></Select></div><div><Label>Topic</Label><Input value={socialForm.topic} onChange={e => setSocialForm({ ...socialForm, topic: e.target.value })} placeholder="e.g., summer renovation deals" /></div></div>
            <Button onClick={() => run("social", () => generateSocialPosts(socialForm))} disabled={!socialForm.topic || running === "social"}><Play className="h-4 w-4 mr-2" />{running === "social" ? "Generating…" : "Generate Posts"}</Button>
          </CardContent></Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{socialPosts.map(p => (<Card key={p.id} className="border-border"><CardContent className="py-4"><div className="flex items-center gap-2 mb-2"><Badge variant="outline">{p.platform}</Badge><Badge variant="outline">{p.content_type}</Badge><Badge variant="outline" className={statusColors[p.status] || ""}>{p.status}</Badge></div><p className="text-sm">{p.caption}</p>{p.hashtags?.length > 0 && <p className="text-xs text-muted-foreground mt-1">{p.hashtags.join(" ")}</p>}{p.cta && <p className="text-xs text-primary mt-1">CTA: {p.cta}</p>}<Button size="sm" variant="outline" className="mt-2" onClick={() => approveDraft(p.id, "ai_social_posts")} disabled={p.status === "approved"}><ThumbsUp className="h-3 w-3 mr-1" />Approve</Button></CardContent></Card>))}</div>
        </TabsContent>
        <TabsContent value="competitor" className="space-y-4">
          <Card className="border-border"><CardHeader><CardTitle className="text-sm">Analyze Competitor</CardTitle></CardHeader><CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div><Label>Competitor Domain</Label><Input value={compForm.competitor_domain} onChange={e => setCompForm({ ...compForm, competitor_domain: e.target.value })} placeholder="competitor.com" /></div><div><Label>Client Domain</Label><Input value={compForm.client_domain} onChange={e => setCompForm({ ...compForm, client_domain: e.target.value })} placeholder="client.com" /></div></div>
            <Button onClick={() => run("comp", () => analyzeCompetitor(compForm))} disabled={!compForm.competitor_domain || running === "comp"}><Play className="h-4 w-4 mr-2" />{running === "comp" ? "Analyzing…" : "Analyze Competitor"}</Button>
          </CardContent></Card>
          {competitors.map(c => (<Card key={c.id} className="border-border"><CardContent className="py-4"><p className="font-medium text-sm mb-2">{c.competitor_domain}</p><div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs"><div><p className="text-muted-foreground mb-1">Keyword Gaps ({Array.isArray(c.keyword_gaps_json) ? c.keyword_gaps_json.length : 0})</p>{Array.isArray(c.keyword_gaps_json) && c.keyword_gaps_json.slice(0, 3).map((g: any, i: number) => <p key={i}>{typeof g === "string" ? g : g.keyword || g.title}</p>)}</div><div><p className="text-muted-foreground mb-1">Content Gaps ({Array.isArray(c.content_gaps_json) ? c.content_gaps_json.length : 0})</p>{Array.isArray(c.content_gaps_json) && c.content_gaps_json.slice(0, 3).map((g: any, i: number) => <p key={i}>{typeof g === "string" ? g : g.topic || g.title}</p>)}</div><div><p className="text-muted-foreground mb-1">Opportunities ({Array.isArray(c.opportunities_json) ? c.opportunities_json.length : 0})</p>{Array.isArray(c.opportunities_json) && c.opportunities_json.slice(0, 3).map((g: any, i: number) => <p key={i}>{typeof g === "string" ? g : g.recommendation || g.title}</p>)}</div></div></CardContent></Card>))}
        </TabsContent>
        <TabsContent value="logs" className="space-y-2">
          {logs.length === 0 ? (<Card><CardContent className="py-8 text-center text-muted-foreground">No execution logs yet.</CardContent></Card>) : logs.map(l => (<Card key={l.id} className="border-border"><CardContent className="py-3 flex items-center justify-between"><div className="flex items-center gap-3"><Badge variant="outline">{l.module}</Badge><span className="text-sm">{l.action}</span><span className="text-xs text-muted-foreground">{l.output_summary}</span></div><span className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()}</span></CardContent></Card>))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AutonomousAgentsPage;
