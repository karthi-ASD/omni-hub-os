import { useState } from "react";
import { useCommunications } from "@/hooks/useCommunications";
import { useTicketAI } from "@/hooks/useTicketAI";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Plus, Mail, MessageSquare, Phone, Send, Radio, FileText,
  BarChart3, Wand2, Bot, Copy, RotateCcw, Sparkles,
} from "lucide-react";

const CommunicationsPage = () => {
  const { providers, templates, sends, loading, addProvider, addTemplate, sendMessage } = useCommunications();
  const { generatingDraft, emailDraft, generateEmailDraft } = useTicketAI();

  const [provOpen, setProvOpen] = useState(false);
  const [provForm, setProvForm] = useState({ channel: "email", provider_type: "sendgrid" });
  const [tmplOpen, setTmplOpen] = useState(false);
  const [tmplForm, setTmplForm] = useState({ channel: "email", template_key: "", subject: "", body: "" });
  const [sendOpen, setSendOpen] = useState(false);
  const [sendForm, setSendForm] = useState({ channel: "email", to_address: "" });

  // AI Draft state
  const [draftPurpose, setDraftPurpose] = useState("");
  const [draftRecipient, setDraftRecipient] = useState("");
  const [draftTone, setDraftTone] = useState("professional");
  const [draftResult, setDraftResult] = useState<string>("");
  const [editableDraft, setEditableDraft] = useState("");

  const channelIcon = (ch: string) => {
    if (ch === "sms") return <Phone className="h-3 w-3" />;
    if (ch === "whatsapp") return <MessageSquare className="h-3 w-3" />;
    return <Mail className="h-3 w-3" />;
  };

  const handleGenerateDraft = async () => {
    if (!draftPurpose.trim()) { toast.error("Please enter a purpose"); return; }
    const result = await generateEmailDraft({
      purpose: draftPurpose,
      recipient_name: draftRecipient || undefined,
      tone: draftTone,
    });
    if (result?.full_text) {
      setDraftResult(result.full_text);
      setEditableDraft(result.full_text);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader icon={Radio} title="Communication Center" subtitle="Unified email, SMS, WhatsApp & AI-assisted messaging"
        actions={
          <Dialog open={sendOpen} onOpenChange={setSendOpen}>
            <DialogTrigger asChild><Button><Send className="mr-2 h-4 w-4" /> Send Message</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Send Message</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Channel</Label>
                  <Select value={sendForm.channel} onValueChange={(v) => setSendForm({ ...sendForm, channel: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>To</Label><Input value={sendForm.to_address} onChange={(e) => setSendForm({ ...sendForm, to_address: e.target.value })} placeholder="email@example.com or +61..." /></div>
                <Button className="w-full" onClick={async () => { if (!sendForm.to_address) return; await sendMessage(sendForm); setSendOpen(false); setSendForm({ channel: "email", to_address: "" }); }}>Queue Message</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard title="Providers" value={providers.length} icon={Radio} gradient="from-primary to-accent" />
        <StatCard title="Templates" value={templates.length} icon={FileText} gradient="from-[hsl(var(--neon-green))] to-[hsl(var(--success))]" />
        <StatCard title="Messages Sent" value={sends.length} icon={BarChart3} gradient="from-[hsl(var(--neon-orange))] to-[hsl(var(--warning))]" />
        <StatCard title="AI Drafts" value={draftResult ? 1 : 0} icon={Bot} gradient="from-primary to-[hsl(var(--neon-purple))]" />
      </div>

      <Tabs defaultValue="ai-draft">
        <TabsList>
          <TabsTrigger value="ai-draft"><Wand2 className="h-3.5 w-3.5 mr-1" /> AI Draft</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="logs">Send Log</TabsTrigger>
        </TabsList>

        {/* AI Email Draft Generator */}
        <TabsContent value="ai-draft" className="space-y-4">
          <Card className="border-primary/20">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">AI Email Draft Generator</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Describe what you need to communicate and AI will generate a professional email draft.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <Label>Purpose / Context</Label>
                    <Textarea
                      value={draftPurpose}
                      onChange={e => setDraftPurpose(e.target.value)}
                      placeholder="e.g. Follow up on SEO report delivery, respond to billing inquiry, welcome new client..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Recipient Name (optional)</Label>
                    <Input value={draftRecipient} onChange={e => setDraftRecipient(e.target.value)} placeholder="John Smith" />
                  </div>
                  <div>
                    <Label>Tone</Label>
                    <Select value={draftTone} onValueChange={setDraftTone}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="formal">Formal</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="follow_up">Follow-up</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleGenerateDraft} disabled={generatingDraft || !draftPurpose.trim()} className="w-full">
                    {generatingDraft ? <><RotateCcw className="h-4 w-4 mr-2 animate-spin" /> Generating...</> : <><Wand2 className="h-4 w-4 mr-2" /> Generate Draft</>}
                  </Button>
                </div>
                <div className="space-y-3">
                  {editableDraft ? (
                    <>
                      <div className="flex items-center justify-between">
                        <Label>Generated Draft</Label>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(editableDraft); toast.success("Copied!"); }}>
                            <Copy className="h-3 w-3 mr-1" /> Copy
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setEditableDraft(""); setDraftResult(""); }}>
                            <RotateCcw className="h-3 w-3 mr-1" /> Clear
                          </Button>
                        </div>
                      </div>
                      <Textarea
                        value={editableDraft}
                        onChange={e => setEditableDraft(e.target.value)}
                        rows={10}
                        className="font-mono text-xs"
                      />
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Bot className="h-3 w-3" /> AI-generated — review and edit before sending
                      </p>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full min-h-[200px] border border-dashed border-border rounded-lg">
                      <div className="text-center text-muted-foreground">
                        <Bot className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">AI draft will appear here</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Configured Providers</h2>
            <Dialog open={provOpen} onOpenChange={setProvOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-3 w-3 mr-1" /> Add Provider</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Communications Provider</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Channel</Label>
                    <Select value={provForm.channel} onValueChange={(v) => setProvForm({ ...provForm, channel: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Provider</Label>
                    <Select value={provForm.provider_type} onValueChange={(v) => setProvForm({ ...provForm, provider_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sendgrid">SendGrid</SelectItem>
                        <SelectItem value="mailgun">Mailgun</SelectItem>
                        <SelectItem value="twilio">Twilio</SelectItem>
                        <SelectItem value="plivo">Plivo</SelectItem>
                        <SelectItem value="meta_whatsapp">Meta WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Card className="border-dashed rounded-xl">
                    <CardContent className="py-3 text-sm text-muted-foreground">
                      API credentials are stored securely via backend secrets. Configure after adding.
                    </CardContent>
                  </Card>
                  <Button className="w-full" onClick={async () => { await addProvider(provForm); setProvOpen(false); }}>Add Provider</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {loading ? <Skeleton className="h-24 w-full rounded-2xl" /> : providers.length === 0 ? (
            <Card className="rounded-2xl"><CardContent className="py-8 text-center text-muted-foreground">No providers configured</CardContent></Card>
          ) : (
            <Card className="rounded-2xl"><Table><TableHeader><TableRow>
              <TableHead>Channel</TableHead><TableHead>Provider</TableHead><TableHead>Status</TableHead><TableHead>Added</TableHead>
            </TableRow></TableHeader><TableBody>
              {providers.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="capitalize flex items-center gap-2">{channelIcon(p.channel)} {p.channel}</TableCell>
                  <TableCell className="capitalize">{p.provider_type.replace(/_/g, " ")}</TableCell>
                  <TableCell><Badge variant="secondary" className={p.is_active ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]" : ""}>{p.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                  <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody></Table></Card>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Message Templates</h2>
            <Dialog open={tmplOpen} onOpenChange={setTmplOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-3 w-3 mr-1" /> Add Template</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Template</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Channel</Label>
                    <Select value={tmplForm.channel} onValueChange={(v) => setTmplForm({ ...tmplForm, channel: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Template Key</Label>
                    <Select value={tmplForm.template_key} onValueChange={(v) => setTmplForm({ ...tmplForm, template_key: v })}>
                      <SelectTrigger><SelectValue placeholder="Select template type" /></SelectTrigger>
                      <SelectContent>
                        {["INVOICE_REMINDER", "SEO_REPORT", "INQUIRY_AUTO_REPLY", "APPOINTMENT_CONFIRM", "PAYMENT_RECEIPT", "WELCOME", "TICKET_CREATED", "TICKET_RESOLVED"].map((k) => (
                          <SelectItem key={k} value={k}>{k.replace(/_/g, " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Subject</Label><Input value={tmplForm.subject} onChange={(e) => setTmplForm({ ...tmplForm, subject: e.target.value })} /></div>
                  <div><Label>Body</Label><Input value={tmplForm.body} onChange={(e) => setTmplForm({ ...tmplForm, body: e.target.value })} placeholder="Use {{variable}} for placeholders" /></div>
                  <Button className="w-full" onClick={async () => { if (!tmplForm.template_key) return; await addTemplate(tmplForm); setTmplOpen(false); setTmplForm({ channel: "email", template_key: "", subject: "", body: "" }); }}>Add Template</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {loading ? <Skeleton className="h-24 w-full rounded-2xl" /> : templates.length === 0 ? (
            <Card className="rounded-2xl"><CardContent className="py-8 text-center text-muted-foreground">No templates yet</CardContent></Card>
          ) : (
            <Card className="rounded-2xl"><Table><TableHeader><TableRow>
              <TableHead>Key</TableHead><TableHead>Channel</TableHead><TableHead>Subject</TableHead><TableHead>Added</TableHead>
            </TableRow></TableHeader><TableBody>
              {templates.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.template_key.replace(/_/g, " ")}</TableCell>
                  <TableCell className="capitalize">{t.channel}</TableCell>
                  <TableCell className="truncate max-w-[200px]">{t.subject || "—"}</TableCell>
                  <TableCell>{new Date(t.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody></Table></Card>
          )}
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <h2 className="text-lg font-semibold">Recent Messages ({sends.length})</h2>
          {loading ? <Skeleton className="h-24 w-full rounded-2xl" /> : sends.length === 0 ? (
            <Card className="rounded-2xl"><CardContent className="py-8 text-center text-muted-foreground">No messages sent yet</CardContent></Card>
          ) : (
            <Card className="rounded-2xl"><Table><TableHeader><TableRow>
              <TableHead>Channel</TableHead><TableHead>To</TableHead><TableHead>Status</TableHead><TableHead>Sent</TableHead>
            </TableRow></TableHeader><TableBody>
              {sends.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="capitalize flex items-center gap-2">{channelIcon(s.channel)} {s.channel}</TableCell>
                  <TableCell>{s.to_address}</TableCell>
                  <TableCell><Badge variant="secondary" className={s.status === "sent" ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]" : s.status === "failed" ? "bg-destructive/10 text-destructive" : ""}>{s.status}</Badge></TableCell>
                  <TableCell>{new Date(s.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody></Table></Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommunicationsPage;
