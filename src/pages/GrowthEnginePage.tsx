import { useEffect, useState } from "react";
import { useGrowthEngine } from "@/hooks/useGrowthEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Rocket, TrendingUp, Globe, FileText, FlaskConical, DollarSign, Zap,
  Plus, RefreshCw, Sparkles, CheckCircle, Clock, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

const statusBadge = (s: string) => {
  if (s === "active" || s === "running") return <Badge variant="default" className="text-[10px]">{s}</Badge>;
  if (s === "completed" || s === "published") return <Badge variant="secondary" className="text-[10px]">{s}</Badge>;
  if (s === "paused" || s === "draft") return <Badge variant="outline" className="text-[10px]">{s}</Badge>;
  return <Badge variant="outline" className="text-[10px]">{s}</Badge>;
};

const GrowthEnginePage = () => {
  const {
    loading, campaigns, experiments, landingPages, seoTasks, proposals,
    fetchAll, optimizeBudgets, generateLandingPage, runSeoAutopilot,
    generateProposal, createExperiment, addCampaign, analyzeExperiment,
  } = useGrowthEngine();
  const [tab, setTab] = useState("dashboard");

  // Form states
  const [lpKeyword, setLpKeyword] = useState("");
  const [lpIndustry, setLpIndustry] = useState("");
  const [lpLocation, setLpLocation] = useState("");
  const [seoKeyword, setSeoKeyword] = useState("");
  const [seoLocation, setSeoLocation] = useState("");
  const [seoIndustry, setSeoIndustry] = useState("");
  const [expName, setExpName] = useState("");
  const [expType, setExpType] = useState("headline");
  const [expA, setExpA] = useState("");
  const [expB, setExpB] = useState("");
  const [campChannel, setCampChannel] = useState("");
  const [campBudget, setCampBudget] = useState("");
  const [propName, setPropName] = useState("");
  const [propService, setPropService] = useState("");
  const [propBudget, setPropBudget] = useState("");

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const activeCampaigns = campaigns.filter((c) => c.status === "active").length;
  const runningExperiments = experiments.filter((e) => e.status === "running").length;
  const pendingSeoTasks = seoTasks.filter((t) => t.status === "pending").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Rocket className="h-6 w-6 text-primary" /> Growth Engine
          </h1>
          <p className="text-muted-foreground">AI-powered autonomous marketing & growth automation</p>
        </div>
        <Button variant="outline" onClick={fetchAll} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Zap className="h-3.5 w-3.5" /> Campaigns</div>
          <p className="text-2xl font-bold">{activeCampaigns}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><FlaskConical className="h-3.5 w-3.5" /> Experiments</div>
          <p className="text-2xl font-bold">{runningExperiments}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Globe className="h-3.5 w-3.5" /> Landing Pages</div>
          <p className="text-2xl font-bold">{landingPages.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><TrendingUp className="h-3.5 w-3.5" /> SEO Tasks</div>
          <p className="text-2xl font-bold">{pendingSeoTasks}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><FileText className="h-3.5 w-3.5" /> Proposals</div>
          <p className="text-2xl font-bold">{proposals.length}</p>
        </CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="experiments">A/B Tests</TabsTrigger>
          <TabsTrigger value="landing">Landing Pages</TabsTrigger>
          <TabsTrigger value="seo">SEO Autopilot</TabsTrigger>
          <TabsTrigger value="proposals">Proposals</TabsTrigger>
        </TabsList>

        {/* DASHBOARD */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4" /> Budget Actions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" onClick={optimizeBudgets} disabled={loading || campaigns.length === 0}>
                  <Sparkles className="mr-2 h-4 w-4" /> Optimize All Budgets
                </Button>
                <p className="text-xs text-muted-foreground">AI will analyze campaign performance and recommend budget changes.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4" /> Quick Generate</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full text-sm" onClick={() => setTab("landing")}>
                  <Plus className="mr-2 h-3.5 w-3.5" /> New Landing Page
                </Button>
                <Button variant="outline" className="w-full text-sm" onClick={() => setTab("seo")}>
                  <Plus className="mr-2 h-3.5 w-3.5" /> SEO Content Tasks
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> Auto Proposal</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full text-sm" onClick={() => setTab("proposals")}>
                  <Plus className="mr-2 h-3.5 w-3.5" /> Generate Proposal
                </Button>
                <p className="text-xs text-muted-foreground">{proposals.filter((p) => p.status === "generated").length} pending review</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* CAMPAIGNS */}
        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Manage ad campaigns & auto-optimize budgets</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={optimizeBudgets} disabled={loading || campaigns.length === 0}>
                <Sparkles className="mr-2 h-3.5 w-3.5" /> Optimize
              </Button>
              <Dialog>
                <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="mr-2 h-3.5 w-3.5" /> Add Campaign</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Campaign</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Channel</Label><Input value={campChannel} onChange={(e) => setCampChannel(e.target.value)} placeholder="e.g. Google Ads" /></div>
                    <div><Label>Budget</Label><Input type="number" value={campBudget} onChange={(e) => setCampBudget(e.target.value)} placeholder="Monthly budget" /></div>
                    <Button onClick={() => { addCampaign(campChannel, Number(campBudget)); setCampChannel(""); setCampBudget(""); }} disabled={!campChannel}>Create</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          {loading ? <Skeleton className="h-40 w-full" /> : (
            <Card><Table><TableHeader><TableRow>
              <TableHead>Channel</TableHead><TableHead>Budget</TableHead><TableHead>Spend</TableHead>
              <TableHead>Conv. Rate</TableHead><TableHead>Leads</TableHead><TableHead>Status</TableHead><TableHead>Last Adjusted</TableHead>
            </TableRow></TableHeader><TableBody>
              {campaigns.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No campaigns yet.</TableCell></TableRow>
              ) : campaigns.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium capitalize">{c.channel}</TableCell>
                  <TableCell>${Number(c.budget).toLocaleString()}</TableCell>
                  <TableCell>${Number(c.current_spend).toLocaleString()}</TableCell>
                  <TableCell>{c.conversion_rate}%</TableCell>
                  <TableCell>{c.leads_generated}</TableCell>
                  <TableCell>{statusBadge(c.status)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{c.last_adjustment ? new Date(c.last_adjustment).toLocaleDateString() : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody></Table></Card>
          )}
        </TabsContent>

        {/* A/B TESTS */}
        <TabsContent value="experiments" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Run and analyze marketing experiments</p>
            <Dialog>
              <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="mr-2 h-3.5 w-3.5" /> New Experiment</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create A/B Experiment</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Name</Label><Input value={expName} onChange={(e) => setExpName(e.target.value)} placeholder="Experiment name" /></div>
                  <div><Label>Type</Label><Input value={expType} onChange={(e) => setExpType(e.target.value)} placeholder="headline, cta, pricing" /></div>
                  <div><Label>Variant A</Label><Input value={expA} onChange={(e) => setExpA(e.target.value)} /></div>
                  <div><Label>Variant B</Label><Input value={expB} onChange={(e) => setExpB(e.target.value)} /></div>
                  <Button onClick={() => { createExperiment(expName, expType, expA, expB); setExpName(""); setExpA(""); setExpB(""); }} disabled={!expName}>Create</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {loading ? <Skeleton className="h-40 w-full" /> : (
            <Card><Table><TableHeader><TableRow>
              <TableHead>Experiment</TableHead><TableHead>Type</TableHead><TableHead>Variant A</TableHead>
              <TableHead>Variant B</TableHead><TableHead>Winner</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead>
            </TableRow></TableHeader><TableBody>
              {experiments.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No experiments yet.</TableCell></TableRow>
              ) : experiments.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.experiment_name}</TableCell>
                  <TableCell className="capitalize">{e.experiment_type}</TableCell>
                  <TableCell className="max-w-[120px] truncate text-xs">{e.variant_a}</TableCell>
                  <TableCell className="max-w-[120px] truncate text-xs">{e.variant_b}</TableCell>
                  <TableCell>{e.winner ? <Badge>{e.winner}</Badge> : "—"}</TableCell>
                  <TableCell>{statusBadge(e.status)}</TableCell>
                  <TableCell>
                    {e.status === "running" && (
                      <Button size="sm" variant="outline" onClick={() => analyzeExperiment(e)} disabled={loading}>Analyze</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody></Table></Card>
          )}
        </TabsContent>

        {/* LANDING PAGES */}
        <TabsContent value="landing" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Generate Landing Page</CardTitle></CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-3 mb-3">
                <div><Label>Keyword</Label><Input value={lpKeyword} onChange={(e) => setLpKeyword(e.target.value)} placeholder="e.g. Bathroom Renovation Brisbane" /></div>
                <div><Label>Industry</Label><Input value={lpIndustry} onChange={(e) => setLpIndustry(e.target.value)} placeholder="e.g. Home Renovation" /></div>
                <div><Label>Location</Label><Input value={lpLocation} onChange={(e) => setLpLocation(e.target.value)} placeholder="e.g. Brisbane" /></div>
              </div>
              <Button onClick={() => { generateLandingPage(lpKeyword, lpIndustry, lpLocation); setLpKeyword(""); setLpIndustry(""); setLpLocation(""); }} disabled={loading || !lpKeyword}>
                <Sparkles className="mr-2 h-4 w-4" /> Generate
              </Button>
            </CardContent>
          </Card>
          {loading ? <Skeleton className="h-40 w-full" /> : (
            <div className="grid md:grid-cols-2 gap-4">
              {landingPages.map((lp) => (
                <Card key={lp.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{lp.title}</CardTitle>
                      {statusBadge(lp.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground mb-2">Keyword: {lp.keyword}</p>
                    {lp.headline && <p className="text-sm font-medium mb-1">{lp.headline}</p>}
                    {lp.meta_description && <p className="text-xs text-muted-foreground">{lp.meta_description}</p>}
                    {lp.content_json?.benefits && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(lp.content_json.benefits as any[]).slice(0, 3).map((b: any, i: number) => (
                          <Badge key={i} variant="secondary" className="text-[10px]">{b.title}</Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {landingPages.length === 0 && <p className="col-span-full text-center text-muted-foreground py-8">No landing pages generated yet.</p>}
            </div>
          )}
        </TabsContent>

        {/* SEO AUTOPILOT */}
        <TabsContent value="seo" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Generate SEO Content Tasks</CardTitle></CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-3 mb-3">
                <div><Label>Primary Keyword</Label><Input value={seoKeyword} onChange={(e) => setSeoKeyword(e.target.value)} placeholder="e.g. Solar Installation" /></div>
                <div><Label>Location</Label><Input value={seoLocation} onChange={(e) => setSeoLocation(e.target.value)} placeholder="e.g. Sydney" /></div>
                <div><Label>Industry</Label><Input value={seoIndustry} onChange={(e) => setSeoIndustry(e.target.value)} placeholder="e.g. Renewable Energy" /></div>
              </div>
              <Button onClick={() => { runSeoAutopilot(seoKeyword, seoLocation, seoIndustry); setSeoKeyword(""); setSeoLocation(""); setSeoIndustry(""); }} disabled={loading || !seoKeyword}>
                <Sparkles className="mr-2 h-4 w-4" /> Generate Tasks
              </Button>
            </CardContent>
          </Card>
          {loading ? <Skeleton className="h-40 w-full" /> : (
            <Card><Table><TableHeader><TableRow>
              <TableHead>Type</TableHead><TableHead>Keyword</TableHead><TableHead>Title</TableHead><TableHead>Status</TableHead>
            </TableRow></TableHeader><TableBody>
              {seoTasks.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No SEO tasks yet.</TableCell></TableRow>
              ) : seoTasks.map((t) => (
                <TableRow key={t.id}>
                  <TableCell><Badge variant="outline" className="text-[10px] capitalize">{t.task_type?.replace(/_/g, " ")}</Badge></TableCell>
                  <TableCell className="text-sm">{t.keyword}</TableCell>
                  <TableCell className="font-medium text-sm">{t.title}</TableCell>
                  <TableCell>{statusBadge(t.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody></Table></Card>
          )}
        </TabsContent>

        {/* PROPOSALS */}
        <TabsContent value="proposals" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Auto-Generate Proposal</CardTitle></CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-3 mb-3">
                <div><Label>Lead Name</Label><Input value={propName} onChange={(e) => setPropName(e.target.value)} placeholder="Lead name" /></div>
                <div><Label>Service</Label><Input value={propService} onChange={(e) => setPropService(e.target.value)} placeholder="e.g. Website Development" /></div>
                <div><Label>Budget Range</Label><Input value={propBudget} onChange={(e) => setPropBudget(e.target.value)} placeholder="e.g. $2000-$5000" /></div>
              </div>
              <Button onClick={() => { generateProposal({ name: propName, service: propService, budget: propBudget }); setPropName(""); setPropService(""); setPropBudget(""); }} disabled={loading || !propName}>
                <FileText className="mr-2 h-4 w-4" /> Generate Proposal
              </Button>
            </CardContent>
          </Card>
          {loading ? <Skeleton className="h-40 w-full" /> : (
            <Card><Table><TableHeader><TableRow>
              <TableHead>Lead</TableHead><TableHead>Service</TableHead><TableHead>Price</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead>
            </TableRow></TableHeader><TableBody>
              {proposals.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No proposals generated yet.</TableCell></TableRow>
              ) : proposals.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.lead_name}</TableCell>
                  <TableCell>{p.service_type}</TableCell>
                  <TableCell>${Number(p.proposed_price).toLocaleString()}</TableCell>
                  <TableCell>{statusBadge(p.status)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody></Table></Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GrowthEnginePage;
