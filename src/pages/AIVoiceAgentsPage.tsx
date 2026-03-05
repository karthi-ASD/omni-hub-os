import { useAIVoiceAgents, AIVoiceAgent, AIAgentScript } from "@/hooks/useAIVoiceAgents";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Bot, Phone, PhoneCall, PhoneOff, PhoneMissed, Calendar, CheckCircle, XCircle,
  Plus, FileText, BarChart3, ClipboardList, History, Star, Shield, Mic,
  TrendingUp, Users, Timer, Zap
} from "lucide-react";
import { useState } from "react";

const AIVoiceAgentsPage = () => {
  usePageTitle("AI Voice Agents", "AI-powered voice agent automation for lead qualification and scheduling");
  const { agents, scripts, callLogs, qualifications, loading, stats, createAgent, toggleAgent, createScript } = useAIVoiceAgents();

  const [agentOpen, setAgentOpen] = useState(false);
  const [scriptOpen, setScriptOpen] = useState(false);
  const [agentForm, setAgentForm] = useState({
    agent_name: "", scope: "sales", autonomy_level: "suggest_only",
    voice_type: "professional", language: "en-AU", ai_provider: "elevenlabs",
    call_timeout_seconds: 60, retry_attempts: 2,
  });
  const [scriptForm, setScriptForm] = useState({
    script_name: "", intro_text: "", verification_text: "",
    scheduling_text: "", closing_text: "", qualification_questions_json: [] as string[],
    agent_id: "",
  });
  const [newQuestion, setNewQuestion] = useState("");

  const [creatingAgent, setCreatingAgent] = useState(false);

  const handleCreateAgent = async () => {
    if (!agentForm.agent_name.trim()) {
      return;
    }
    setCreatingAgent(true);
    try {
      const ok = await createAgent(agentForm as any);
      if (ok) { setAgentOpen(false); setAgentForm({ agent_name: "", scope: "sales", autonomy_level: "suggest_only", voice_type: "professional", language: "en-AU", ai_provider: "elevenlabs", call_timeout_seconds: 60, retry_attempts: 2 }); }
    } finally {
      setCreatingAgent(false);
    }
  };

  const handleCreateScript = async () => {
    const ok = await createScript({ ...scriptForm, qualification_questions_json: scriptForm.qualification_questions_json, agent_id: scriptForm.agent_id || undefined } as any);
    if (ok) { setScriptOpen(false); setScriptForm({ script_name: "", intro_text: "", verification_text: "", scheduling_text: "", closing_text: "", qualification_questions_json: [], agent_id: "" }); }
  };

  const addQuestion = () => {
    if (newQuestion.trim()) {
      setScriptForm(f => ({ ...f, qualification_questions_json: [...f.qualification_questions_json, newQuestion.trim()] }));
      setNewQuestion("");
    }
  };

  const statusColors: Record<string, string> = {
    completed: "text-green-500", pending: "text-amber-500", no_answer: "text-red-500",
    scheduled: "text-blue-500", failed: "text-destructive", in_progress: "text-cyan-500",
  };

  const providerLabels: Record<string, string> = {
    elevenlabs: "ElevenLabs", twilio: "Twilio", retell: "Retell AI", vapi: "Vapi AI", deepgram: "Deepgram",
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Phone className="h-6 w-6 text-primary" />
            AI Voice Agent Automation
          </h1>
          <p className="text-muted-foreground">Automatically call, qualify & schedule leads with AI voice agents</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-xs"><Shield className="h-3 w-3 mr-1" />GDPR Compliant</Badge>
          <Badge variant="outline" className="text-xs"><Mic className="h-3 w-3 mr-1" />Consent Required</Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Calls Today", value: stats.totalCallsToday, icon: PhoneCall, color: "text-blue-500" },
          { label: "Qualified Leads", value: stats.qualifiedLeads, icon: CheckCircle, color: "text-green-500" },
          { label: "Answered", value: stats.callsAnswered, icon: Phone, color: "text-emerald-500" },
          { label: "Missed", value: stats.callsMissed, icon: PhoneMissed, color: "text-red-500" },
          { label: "Scheduled", value: stats.callsScheduled, icon: Calendar, color: "text-amber-500" },
          { label: "Conversion", value: `${stats.conversionRate}%`, icon: TrendingUp, color: "text-primary" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3 text-center">
              <s.icon className={`h-5 w-5 mx-auto mb-1 ${s.color}`} />
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="dashboard">
        <TabsList className="flex-wrap">
          <TabsTrigger value="dashboard"><BarChart3 className="mr-1 h-4 w-4" />Dashboard</TabsTrigger>
          <TabsTrigger value="agents"><Bot className="mr-1 h-4 w-4" />Agents ({agents.length})</TabsTrigger>
          <TabsTrigger value="scripts"><FileText className="mr-1 h-4 w-4" />Scripts ({scripts.length})</TabsTrigger>
          <TabsTrigger value="queue"><ClipboardList className="mr-1 h-4 w-4" />Call Queue</TabsTrigger>
          <TabsTrigger value="history"><History className="mr-1 h-4 w-4" />Call History</TabsTrigger>
          <TabsTrigger value="qualifications"><Star className="mr-1 h-4 w-4" />Qualifications</TabsTrigger>
        </TabsList>

        {/* TAB 1: Dashboard */}
        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Call Flow Pipeline</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { step: "Form Submission", pct: 100 },
                  { step: "Lead Created in CRM", pct: 95 },
                  { step: "AI Call Triggered", pct: 88 },
                  { step: "Call Answered", pct: 62 },
                  { step: "Lead Qualified", pct: 45 },
                  { step: "Follow-up Scheduled", pct: 38 },
                  { step: "Converted", pct: stats.conversionRate },
                ].map(s => (
                  <div key={s.step}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{s.step}</span><span className="text-muted-foreground">{s.pct}%</span>
                    </div>
                    <Progress value={s.pct} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Active Agents</CardTitle></CardHeader>
              <CardContent>
                {agents.filter(a => a.enabled).length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No active agents. Create and enable one to start.</p>
                ) : (
                  <div className="space-y-3">
                    {agents.filter(a => a.enabled).map(agent => (
                      <div key={agent.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <Bot className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium text-sm">{agent.agent_name}</p>
                            <p className="text-xs text-muted-foreground">{providerLabels[agent.ai_provider] || agent.ai_provider} · {agent.language}</p>
                          </div>
                        </div>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Zap className="h-4 w-4 text-amber-500" />AI Call Workflow</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  {["Website Form", "→", "CRM Lead", "→", "AI Call Triggered", "→", "Intro & Verify", "→", "Qualification Qs", "→", "Schedule Follow-up", "→", "Data Saved", "→", "Email Summary"].map((step, i) =>
                    step === "→" ? <span key={i} className="text-muted-foreground">→</span> : <Badge key={i} variant="outline" className="text-xs">{step}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: Agents */}
        <TabsContent value="agents">
          <div className="flex justify-end mb-4">
            <Dialog open={agentOpen} onOpenChange={setAgentOpen}>
              <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />New Voice Agent</Button></DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Create AI Voice Agent</DialogTitle></DialogHeader>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                  <div><Label>Agent Name</Label><Input value={agentForm.agent_name} onChange={e => setAgentForm(f => ({ ...f, agent_name: e.target.value }))} placeholder="SEO Lead Qualifier" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Scope</Label>
                      <Select value={agentForm.scope} onValueChange={v => setAgentForm(f => ({ ...f, scope: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sales">Sales</SelectItem>
                          <SelectItem value="seo">SEO</SelectItem>
                          <SelectItem value="support">Support</SelectItem>
                          <SelectItem value="collections">Collections</SelectItem>
                          <SelectItem value="booking">Booking</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Voice Type</Label>
                      <Select value={agentForm.voice_type} onValueChange={v => setAgentForm(f => ({ ...f, voice_type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="friendly">Friendly</SelectItem>
                          <SelectItem value="neutral">Neutral</SelectItem>
                          <SelectItem value="authoritative">Authoritative</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Language</Label>
                      <Select value={agentForm.language} onValueChange={v => setAgentForm(f => ({ ...f, language: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en-AU">English (AU)</SelectItem>
                          <SelectItem value="en-US">English (US)</SelectItem>
                          <SelectItem value="en-GB">English (UK)</SelectItem>
                          <SelectItem value="hi-IN">Hindi</SelectItem>
                          <SelectItem value="es-ES">Spanish</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>AI Provider</Label>
                      <Select value={agentForm.ai_provider} onValueChange={v => setAgentForm(f => ({ ...f, ai_provider: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                          <SelectItem value="twilio">Twilio Voice</SelectItem>
                          <SelectItem value="retell">Retell AI</SelectItem>
                          <SelectItem value="vapi">Vapi AI</SelectItem>
                          <SelectItem value="deepgram">Deepgram</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Call Timeout (s)</Label><Input type="number" value={agentForm.call_timeout_seconds} onChange={e => setAgentForm(f => ({ ...f, call_timeout_seconds: Number(e.target.value) }))} /></div>
                    <div><Label>Retry Attempts</Label><Input type="number" value={agentForm.retry_attempts} onChange={e => setAgentForm(f => ({ ...f, retry_attempts: Number(e.target.value) }))} /></div>
                  </div>
                  <div><Label>Autonomy Level</Label>
                    <Select value={agentForm.autonomy_level} onValueChange={v => setAgentForm(f => ({ ...f, autonomy_level: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="suggest_only">Suggest Only</SelectItem>
                        <SelectItem value="auto_draft">Auto Draft</SelectItem>
                        <SelectItem value="auto_execute_approved">Auto Execute (Approved)</SelectItem>
                        <SelectItem value="fully_autonomous">Fully Autonomous</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateAgent} disabled={creatingAgent || !agentForm.agent_name.trim()} className="w-full">{creatingAgent ? "Creating..." : "Create Agent"}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map(agent => (
              <Card key={agent.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">{agent.agent_name}</CardTitle>
                    </div>
                    <Switch checked={agent.enabled} onCheckedChange={v => toggleAgent(agent.id, v)} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="capitalize text-xs">{agent.scope}</Badge>
                    <Badge variant="secondary" className="text-xs">{providerLabels[agent.ai_provider] || agent.ai_provider}</Badge>
                    <Badge variant="secondary" className="text-xs">{agent.voice_type}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>Language: {agent.language} · Timeout: {agent.call_timeout_seconds}s</p>
                    <p>Retries: {agent.retry_attempts} · {agent.autonomy_level.replace(/_/g, " ")}</p>
                    <p>{callLogs.filter(c => c.agent_id === agent.id).length} calls made</p>
                  </div>
                </CardContent>
              </Card>
            ))}
            {agents.length === 0 && <Card className="col-span-full"><CardContent className="py-8 text-center text-muted-foreground">No agents yet. Create one to get started.</CardContent></Card>}
          </div>
        </TabsContent>

        {/* TAB 3: Scripts */}
        <TabsContent value="scripts">
          <div className="flex justify-end mb-4">
            <Dialog open={scriptOpen} onOpenChange={setScriptOpen}>
              <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />New Script</Button></DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Create Agent Script</DialogTitle></DialogHeader>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                  <div><Label>Script Name</Label><Input value={scriptForm.script_name} onChange={e => setScriptForm(f => ({ ...f, script_name: e.target.value }))} placeholder="SEO Qualification Script" /></div>
                  {agents.length > 0 && (
                    <div><Label>Assign to Agent (optional)</Label>
                      <Select value={scriptForm.agent_id} onValueChange={v => setScriptForm(f => ({ ...f, agent_id: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select agent" /></SelectTrigger>
                        <SelectContent>
                          {agents.map(a => <SelectItem key={a.id} value={a.id}>{a.agent_name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div><Label>Introduction</Label><Textarea value={scriptForm.intro_text} onChange={e => setScriptForm(f => ({ ...f, intro_text: e.target.value }))} placeholder='Hi this is the AI assistant calling on behalf of [Client Business Name], powered by Nextweb.' rows={3} /></div>
                  <div><Label>Verification</Label><Textarea value={scriptForm.verification_text} onChange={e => setScriptForm(f => ({ ...f, verification_text: e.target.value }))} placeholder='Am I speaking with [Lead Name]?' rows={2} /></div>
                  <div>
                    <Label>Qualification Questions</Label>
                    <div className="space-y-2">
                      {scriptForm.qualification_questions_json.map((q: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">{i + 1}.</span>
                          <span className="flex-1">{q}</span>
                          <Button size="sm" variant="ghost" onClick={() => setScriptForm(f => ({ ...f, qualification_questions_json: f.qualification_questions_json.filter((_: string, j: number) => j !== i) }))}><XCircle className="h-3 w-3" /></Button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <Input value={newQuestion} onChange={e => setNewQuestion(e.target.value)} placeholder="What are you trying to achieve?" onKeyDown={e => e.key === "Enter" && addQuestion()} />
                        <Button size="sm" variant="outline" onClick={addQuestion}>Add</Button>
                      </div>
                    </div>
                  </div>
                  <div><Label>Scheduling</Label><Textarea value={scriptForm.scheduling_text} onChange={e => setScriptForm(f => ({ ...f, scheduling_text: e.target.value }))} placeholder='Our team would like to speak with you. What day and time works best?' rows={2} /></div>
                  <div><Label>Closing</Label><Textarea value={scriptForm.closing_text} onChange={e => setScriptForm(f => ({ ...f, closing_text: e.target.value }))} placeholder='Great, I have scheduled your call. You will receive a confirmation email shortly.' rows={2} /></div>
                  <Button onClick={handleCreateScript} className="w-full">Create Script</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scripts.map(script => (
              <Card key={script.id}>
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4 text-primary" />{script.script_name}</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {script.intro_text && <div><p className="text-xs font-medium text-muted-foreground">Intro:</p><p className="text-xs">{script.intro_text.substring(0, 120)}...</p></div>}
                  {Array.isArray(script.qualification_questions_json) && script.qualification_questions_json.length > 0 && (
                    <div><p className="text-xs font-medium text-muted-foreground">Questions: {script.qualification_questions_json.length}</p></div>
                  )}
                  <div className="flex gap-1">
                    {script.is_default && <Badge className="text-xs">Default</Badge>}
                    {script.agent_id && <Badge variant="secondary" className="text-xs">Assigned</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
            {scripts.length === 0 && <Card className="col-span-full"><CardContent className="py-8 text-center text-muted-foreground">No scripts yet. Create one to define your AI call flow.</CardContent></Card>}
          </div>
        </TabsContent>

        {/* TAB 4: Call Queue */}
        <TabsContent value="queue">
          <Card>
            <CardHeader><CardTitle className="text-base">Lead Call Queue</CardTitle></CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead Name</TableHead><TableHead>Phone</TableHead><TableHead>Source</TableHead>
                  <TableHead>Status</TableHead><TableHead>Agent</TableHead><TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {callLogs.filter(c => ["pending", "scheduled", "in_progress"].includes(c.call_status)).map(call => {
                  const agent = agents.find(a => a.id === call.agent_id);
                  return (
                    <TableRow key={call.id}>
                      <TableCell className="font-medium">{call.lead_name || "Unknown"}</TableCell>
                      <TableCell>{call.lead_phone || "—"}</TableCell>
                      <TableCell className="text-xs">{call.website_source || "—"}</TableCell>
                      <TableCell><Badge variant="outline" className={statusColors[call.call_status] || ""}>{call.call_status}</Badge></TableCell>
                      <TableCell className="text-xs">{agent?.agent_name || "—"}</TableCell>
                      <TableCell className="text-xs">{new Date(call.created_at).toLocaleString("en-AU")}</TableCell>
                    </TableRow>
                  );
                })}
                {callLogs.filter(c => ["pending", "scheduled", "in_progress"].includes(c.call_status)).length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No calls in queue</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* TAB 5: Call History */}
        <TabsContent value="history">
          <Card>
            <CardHeader><CardTitle className="text-base">Call History</CardTitle></CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead><TableHead>Phone</TableHead><TableHead>Agent</TableHead>
                  <TableHead>Duration</TableHead><TableHead>Outcome</TableHead><TableHead>Summary</TableHead><TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {callLogs.map(call => {
                  const agent = agents.find(a => a.id === call.agent_id);
                  return (
                    <TableRow key={call.id}>
                      <TableCell className="font-medium">{call.lead_name || "Unknown"}</TableCell>
                      <TableCell className="text-xs">{call.lead_phone || "—"}</TableCell>
                      <TableCell className="text-xs">{agent?.agent_name || "—"}</TableCell>
                      <TableCell>{call.call_duration_seconds ? `${Math.floor(call.call_duration_seconds / 60)}m ${call.call_duration_seconds % 60}s` : "—"}</TableCell>
                      <TableCell><Badge variant={call.call_outcome === "qualified" ? "default" : call.call_outcome === "not_interested" ? "destructive" : "outline"}>{call.call_outcome || call.call_status}</Badge></TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">{call.ai_summary || "—"}</TableCell>
                      <TableCell className="text-xs">{new Date(call.created_at).toLocaleDateString("en-AU")}</TableCell>
                    </TableRow>
                  );
                })}
                {callLogs.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No call history yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* TAB 6: Lead Qualifications */}
        <TabsContent value="qualifications">
          <Card>
            <CardHeader><CardTitle className="text-base">Lead Qualification Results</CardTitle></CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead><TableHead>Service</TableHead><TableHead>Budget</TableHead>
                  <TableHead>Timeframe</TableHead><TableHead>Project Type</TableHead><TableHead>Score</TableHead>
                  <TableHead>Follow-up</TableHead><TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {qualifications.map(q => (
                  <TableRow key={q.id}>
                    <TableCell className="font-medium">{q.lead_name || "Unknown"}</TableCell>
                    <TableCell className="text-xs">{q.service_interest || "—"}</TableCell>
                    <TableCell className="text-xs">{q.budget_range || "—"}</TableCell>
                    <TableCell className="text-xs">{q.timeframe || "—"}</TableCell>
                    <TableCell className="text-xs">{q.project_type || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className={`font-bold ${q.lead_score >= 70 ? "text-green-500" : q.lead_score >= 40 ? "text-amber-500" : "text-red-500"}`}>{q.lead_score}</span>
                        <span className="text-xs text-muted-foreground">/100</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{q.followup_date ? `${q.followup_date} ${q.followup_time || ""}` : "—"}</TableCell>
                    <TableCell><Badge variant={q.status === "qualified" ? "default" : "outline"}>{q.status}</Badge></TableCell>
                  </TableRow>
                ))}
                {qualifications.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No qualification data yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIVoiceAgentsPage;
