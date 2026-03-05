import { useState } from "react";
import { useVoiceAgentSessions } from "@/hooks/useVoiceAgentSessions";
import { usePageTitle } from "@/hooks/usePageTitle";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Phone, PhoneCall, PhoneOff, PhoneMissed, Calendar, CheckCircle2,
  Clock, AlertCircle, BarChart3, Play, RotateCcw, FileText, User,
  Settings2, Mic, Plus, TrendingUp, Loader2, Zap,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  QUEUED: { icon: Clock, color: "bg-blue-500/20 text-blue-400", label: "Queued" },
  CALLING: { icon: PhoneCall, color: "bg-amber-500/20 text-amber-400", label: "Calling" },
  IN_PROGRESS: { icon: Mic, color: "bg-purple-500/20 text-purple-400", label: "In Progress" },
  COMPLETED: { icon: CheckCircle2, color: "bg-emerald-500/20 text-emerald-400", label: "Completed" },
  FAILED: { icon: PhoneOff, color: "bg-red-500/20 text-red-400", label: "Failed" },
  NO_ANSWER: { icon: PhoneMissed, color: "bg-gray-500/20 text-gray-400", label: "No Answer" },
  RESCHEDULED: { icon: Calendar, color: "bg-cyan-500/20 text-cyan-400", label: "Rescheduled" },
};

const defaultCallScript = {
  intro: "Hello, this is {{agent_name}} calling from {{business_name}}. Am I speaking with {{lead_name}}?",
  verification: "Great! I'm following up on your recent inquiry through our website. You mentioned you were interested in {{service_interest}}. Is that correct?",
  qualification_questions: [
    "What specific services are you looking for?",
    "Do you have a rough budget in mind for this project?",
    "What's your ideal timeframe to get started?",
    "Is there anything specific you'd like to achieve with this project?",
    "Are you the decision-maker for this, or is there someone else involved?"
  ],
  scheduling: "Based on what you've told me, I think we can definitely help. I'd love to schedule a more detailed consultation. Would {{followup_date}} at {{followup_time}} work for you?",
  closing: "Wonderful! I've got you booked in for {{confirmed_date}} at {{confirmed_time}}. You'll receive a confirmation email shortly. Is there anything else I can help with today?",
  objection_handling: {
    not_interested: "I completely understand. Would it be okay if I sent you some information via email for future reference?",
    too_expensive: "We have flexible packages tailored to different budgets. Would you like to hear about those options?",
    need_to_think: "Of course. Can I schedule a follow-up call for later this week?",
    already_have_provider: "We often work alongside existing providers. Would you be open to a quick comparison?"
  },
  consent_request: "Before we continue, I'd like to let you know this call may be recorded for quality and training purposes. Is that okay with you?",
  voicemail_script: "Hi {{lead_name}}, this is {{agent_name}} from {{business_name}}. I'm calling about your recent inquiry. Please call us back at {{callback_number}} or I'll try you again shortly. Thank you!"
};

const VoiceAgentPage = () => {
  usePageTitle("Voice Agent");
  const {
    sessions, extractions, policies, scripts, stats, loading,
    createSession, retrySession, savePolicy, saveScript, refresh,
  } = useVoiceAgentSessions();

  const [tab, setTab] = useState("dashboard");
  const [filter, setFilter] = useState("ALL");
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [scriptDialog, setScriptDialog] = useState(false);
  const [scriptName, setScriptName] = useState("");
  const [scriptJson, setScriptJson] = useState("");
  const [processingQueue, setProcessingQueue] = useState(false);

  const processQueue = async () => {
    setProcessingQueue(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-voice-agent-queue");
      if (error) throw error;
      toast.success(`Queue processed: ${data?.processed ?? 0} sessions handled`);
      refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to process queue");
    } finally {
      setProcessingQueue(false);
    }
  };

  const policy = policies[0];
  const [policyEnabled, setPolicyEnabled] = useState(policy?.is_enabled ?? true);
  const [maxAttempts, setMaxAttempts] = useState(String(policy?.max_attempts ?? 3));
  const [retryMins, setRetryMins] = useState(String(policy?.retry_minutes ?? 15));
  const [windowStart, setWindowStart] = useState(policy?.call_window_start ?? "09:00");
  const [windowEnd, setWindowEnd] = useState(policy?.call_window_end ?? "18:00");
  const [callTz, setCallTz] = useState(policy?.call_timezone ?? "Australia/Sydney");
  const [requireConsent, setRequireConsent] = useState(policy?.require_consent ?? true);

  const filteredSessions = filter === "ALL" ? sessions : sessions.filter(s => s.status === filter);
  const detail = sessions.find(s => s.id === selectedSession);
  const detailExtraction = extractions.find(e => e.session_id === selectedSession);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Voice Agent</h1>
          <p className="text-sm text-muted-foreground">AI-powered lead qualification via Plivo voice calls</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={processQueue} disabled={processingQueue}>
            {processingQueue ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
            Process Queue
          </Button>
          <Button onClick={() => createSession({})} className="bg-[#d4a853] text-[#0a0e1a] hover:bg-[#c49b48]">
            <Plus className="h-4 w-4 mr-2" /> Manual Call
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Sessions", value: stats.total, icon: Phone, color: "text-[#d4a853]" },
          { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-emerald-400" },
          { label: "Booked", value: stats.booked, icon: Calendar, color: "text-blue-400" },
          { label: "Conversion", value: `${stats.conversionRate}%`, icon: TrendingUp, color: "text-purple-400" },
        ].map(s => (
          <Card key={s.label} className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="extractions">Extractions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Dashboard */}
        <TabsContent value="dashboard">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(statusConfig).map(([key, cfg]) => {
              const count = sessions.filter(s => s.status === key).length;
              return (
                <Card key={key} className="bg-card border-border cursor-pointer hover:border-[#d4a853]/30 transition-colors"
                  onClick={() => { setFilter(key); setTab("sessions"); }}>
                  <CardContent className="p-4 text-center">
                    <cfg.icon className={`h-6 w-6 mx-auto mb-2 ${cfg.color.split(" ")[1]}`} />
                    <p className="text-xl font-bold text-foreground">{count}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{cfg.label}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Recent sessions */}
          <Card className="bg-card border-border mt-4">
            <CardHeader><CardTitle className="text-base">Recent Sessions</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Attempt</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.slice(0, 10).map(s => {
                    const ext = extractions.find(e => e.session_id === s.id);
                    const cfg = statusConfig[s.status] || statusConfig.QUEUED;
                    return (
                      <TableRow key={s.id} className="cursor-pointer hover:bg-accent/30"
                        onClick={() => { setSelectedSession(s.id); setTab("sessions"); }}>
                        <TableCell className="font-medium">{ext?.lead_name || "Unknown"}</TableCell>
                        <TableCell><Badge className={cfg.color}>{cfg.label}</Badge></TableCell>
                        <TableCell>{s.attempt_number}</TableCell>
                        <TableCell>{s.call_duration_seconds ? `${s.call_duration_seconds}s` : "—"}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(s.created_at), "MMM d, h:mm a")}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions */}
        <TabsContent value="sessions">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 bg-card border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Sessions</CardTitle>
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-[120px] h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All</SelectItem>
                      {Object.entries(statusConfig).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  {loading ? (
                    <div className="p-8 text-center text-muted-foreground">Loading...</div>
                  ) : filteredSessions.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">No sessions</div>
                  ) : (
                    filteredSessions.map(s => {
                      const ext = extractions.find(e => e.session_id === s.id);
                      const cfg = statusConfig[s.status] || statusConfig.QUEUED;
                      return (
                        <button key={s.id} onClick={() => setSelectedSession(s.id)}
                          className={`w-full text-left p-4 border-b border-border hover:bg-accent/50 transition-colors ${
                            selectedSession === s.id ? "bg-accent/30 border-l-2 border-l-[#d4a853]" : ""
                          }`}>
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-sm text-foreground">{ext?.lead_name || "Lead #" + s.id.slice(0, 6)}</p>
                              <p className="text-xs text-muted-foreground">{ext?.service_interest || "—"}</p>
                            </div>
                            <Badge className={`text-[10px] ${cfg.color}`}>{cfg.label}</Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Attempt {s.attempt_number} • {format(new Date(s.created_at), "MMM d, h:mm a")}
                          </p>
                        </button>
                      );
                    })
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Detail panel */}
            <Card className="lg:col-span-2 bg-card border-border">
              {!detail ? (
                <CardContent className="flex items-center justify-center h-[540px]">
                  <div className="text-center text-muted-foreground">
                    <Phone className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Select a session to view details</p>
                  </div>
                </CardContent>
              ) : (
                <>
                  <CardHeader className="border-b border-border pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{detailExtraction?.lead_name || "Session Detail"}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          {detail.plivo_call_uuid ? `Plivo: ${detail.plivo_call_uuid}` : "No call UUID"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {["FAILED", "NO_ANSWER"].includes(detail.status) && (
                          <Button size="sm" variant="outline" onClick={() => retrySession(detail.id)}>
                            <RotateCcw className="h-3 w-3 mr-1" /> Retry
                          </Button>
                        )}
                        {detail.recording_url && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={detail.recording_url} target="_blank" rel="noopener">
                              <Play className="h-3 w-3 mr-1" /> Recording
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <ScrollArea className="h-[430px]">
                      <div className="space-y-4">
                        {/* Status + timing */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[
                            { label: "Status", value: statusConfig[detail.status]?.label || detail.status },
                            { label: "Attempt", value: detail.attempt_number },
                            { label: "Duration", value: detail.call_duration_seconds ? `${detail.call_duration_seconds}s` : "—" },
                            { label: "Outcome", value: detailExtraction?.call_outcome || "—" },
                          ].map(f => (
                            <div key={f.label} className="bg-accent/30 rounded-lg p-3">
                              <p className="text-[10px] text-muted-foreground uppercase">{f.label}</p>
                              <p className="text-sm font-semibold text-foreground">{f.value}</p>
                            </div>
                          ))}
                        </div>

                        {/* Extraction */}
                        {detailExtraction && (
                          <div>
                            <p className="text-xs font-semibold text-[#d4a853] uppercase tracking-wider mb-2">Extracted Data</p>
                            <div className="grid grid-cols-2 gap-3">
                              {[
                                { label: "Phone", value: detailExtraction.phone },
                                { label: "Email", value: detailExtraction.email },
                                { label: "Service", value: detailExtraction.service_interest },
                                { label: "Budget", value: detailExtraction.budget_range },
                                { label: "Timeframe", value: `${detailExtraction.timeframe_start || "—"} → ${detailExtraction.timeframe_end || "—"}` },
                                { label: "Follow-up", value: `${detailExtraction.confirmed_followup_date || "—"} ${detailExtraction.confirmed_followup_time || ""}` },
                                { label: "Timezone", value: detailExtraction.timezone },
                                { label: "Consent", value: detailExtraction.consent_confirmed ? "✅ Yes" : "❌ No" },
                              ].map(f => (
                                <div key={f.label} className="bg-accent/20 rounded-lg p-2.5">
                                  <p className="text-[10px] text-muted-foreground uppercase">{f.label}</p>
                                  <p className="text-sm text-foreground">{f.value || "—"}</p>
                                </div>
                              ))}
                            </div>
                            {detailExtraction.requirement_summary && (
                              <div className="mt-3 bg-accent/20 rounded-lg p-3">
                                <p className="text-[10px] text-muted-foreground uppercase">Requirement Summary</p>
                                <p className="text-sm text-foreground mt-1">{detailExtraction.requirement_summary}</p>
                              </div>
                            )}
                            {detailExtraction.call_summary && (
                              <div className="mt-2 bg-accent/20 rounded-lg p-3">
                                <p className="text-[10px] text-muted-foreground uppercase">Call Summary</p>
                                <p className="text-sm text-foreground mt-1">{detailExtraction.call_summary}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Transcript */}
                        {detail.transcript_text && (
                          <div>
                            <p className="text-xs font-semibold text-[#d4a853] uppercase tracking-wider mb-2">Transcript</p>
                            <div className="bg-accent/20 rounded-lg p-3 max-h-40 overflow-y-auto">
                              <p className="text-sm text-foreground whitespace-pre-wrap">{detail.transcript_text}</p>
                            </div>
                          </div>
                        )}

                        {/* AI Summary */}
                        {detail.ai_summary && (
                          <div>
                            <p className="text-xs font-semibold text-[#d4a853] uppercase tracking-wider mb-2">AI Summary</p>
                            <div className="bg-[#d4a853]/10 rounded-lg p-3 border border-[#d4a853]/20">
                              <p className="text-sm text-foreground">{detail.ai_summary}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* Extractions */}
        <TabsContent value="extractions">
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Follow-up</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead>Consent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {extractions.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No extractions yet</TableCell></TableRow>
                  ) : (
                    extractions.map(e => (
                      <TableRow key={e.id} className="cursor-pointer hover:bg-accent/30"
                        onClick={() => { setSelectedSession(e.session_id); setTab("sessions"); }}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{e.lead_name || "—"}</p>
                            <p className="text-xs text-muted-foreground">{e.phone}</p>
                          </div>
                        </TableCell>
                        <TableCell>{e.service_interest || "—"}</TableCell>
                        <TableCell>{e.budget_range || "—"}</TableCell>
                        <TableCell className="text-sm">
                          {e.confirmed_followup_date ? `${e.confirmed_followup_date} ${e.confirmed_followup_time || ""}` : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            e.call_outcome === "BOOKED" ? "bg-emerald-500/20 text-emerald-400" :
                            e.call_outcome === "NOT_INTERESTED" ? "bg-red-500/20 text-red-400" :
                            "bg-gray-500/20 text-gray-400"
                          }>{e.call_outcome || "PENDING"}</Badge>
                        </TableCell>
                        <TableCell>{e.consent_confirmed ? "✅" : "❌"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Policy */}
            <Card className="bg-card border-border">
              <CardHeader><CardTitle className="text-base">Call Policy</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Auto-call enabled</span>
                  <Switch checked={policyEnabled} onCheckedChange={setPolicyEnabled} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Require consent</span>
                  <Switch checked={requireConsent} onCheckedChange={setRequireConsent} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Window Start</label>
                    <Input type="time" value={windowStart} onChange={e => setWindowStart(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Window End</label>
                    <Input type="time" value={windowEnd} onChange={e => setWindowEnd(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Timezone</label>
                  <Input value={callTz} onChange={e => setCallTz(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Max Attempts</label>
                    <Input type="number" value={maxAttempts} onChange={e => setMaxAttempts(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Retry (min)</label>
                    <Input type="number" value={retryMins} onChange={e => setRetryMins(e.target.value)} />
                  </div>
                </div>
                <Button className="w-full bg-[#d4a853] text-[#0a0e1a]" onClick={() => savePolicy({
                  is_enabled: policyEnabled,
                  require_consent: requireConsent,
                  call_window_start: windowStart,
                  call_window_end: windowEnd,
                  call_timezone: callTz,
                  max_attempts: parseInt(maxAttempts),
                  retry_minutes: parseInt(retryMins),
                })}>Save Policy</Button>
              </CardContent>
            </Card>

            {/* Scripts */}
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Call Scripts</CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => {
                      setScriptName("Default Lead Qualification");
                      setScriptJson(JSON.stringify(defaultCallScript, null, 2));
                      setScriptDialog(true);
                    }}>
                      <FileText className="h-3 w-3 mr-1" /> Use Template
                    </Button>
                    <Dialog open={scriptDialog} onOpenChange={setScriptDialog}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline"><Plus className="h-3 w-3 mr-1" /> New</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader><DialogTitle>Create Call Script</DialogTitle></DialogHeader>
                        <div className="space-y-4 pt-2">
                          <Input placeholder="Script name" value={scriptName} onChange={e => setScriptName(e.target.value)} />
                          <Textarea placeholder='Paste or edit the call script JSON...' rows={16}
                            value={scriptJson} onChange={e => setScriptJson(e.target.value)}
                            className="font-mono text-xs" />
                          <p className="text-xs text-muted-foreground">
                            The script defines the full conversation flow: intro → verification → qualification questions → scheduling → closing.
                          </p>
                          <Button className="w-full bg-[#d4a853] text-[#0a0e1a]" onClick={async () => {
                            try {
                              const json = JSON.parse(scriptJson || "{}");
                              await saveScript({ name: scriptName, script_json: json });
                              setScriptDialog(false);
                              setScriptName(""); setScriptJson("");
                            } catch { /* toast handled in hook */ }
                          }}>Save Script</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {scripts.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">No scripts yet</div>
                ) : (
                  <div className="divide-y divide-border">
                    {scripts.map(s => (
                      <div key={s.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm text-foreground">{s.name}</p>
                            <p className="text-xs text-muted-foreground">{s.language} • {s.business_id ? "Tenant" : "Global"}</p>
                          </div>
                          <Badge variant="outline">{format(new Date(s.created_at), "MMM d")}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VoiceAgentPage;
