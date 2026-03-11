import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWebsites } from "@/hooks/useWebsites";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Globe, Plus, Shield, Copy, Check, Clock, Key, Server, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  pending: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]",
  approved: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]",
  rejected: "bg-destructive/10 text-destructive",
  disabled: "bg-muted text-muted-foreground",
};

const WebsitesPage = () => {
  const navigate = useNavigate();
  const { websites, services, loading, requestWebsite, approveWebsite, disableWebsite, fetchServices, addService, removeService } = useWebsites();
  const { isSuperAdmin } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", domain: "" });
  const [selectedWebsite, setSelectedWebsite] = useState<string | null>(null);
  const [apiKeyModal, setApiKeyModal] = useState<{ open: boolean; key: string }>({ open: false, key: "" });
  const [copied, setCopied] = useState(false);
  const [serviceForm, setServiceForm] = useState({ name: "", category: "", description: "" });

  const handleCreate = async () => {
    if (!form.name || !form.domain) return;
    await requestWebsite(form.name, form.domain);
    setForm({ name: "", domain: "" });
    setCreateOpen(false);
  };

  const handleApprove = async (id: string) => {
    const key = await approveWebsite(id);
    if (key) setApiKeyModal({ open: true, key });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKeyModal.key);
    setCopied(true);
    toast.success("API key copied!");
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSelectWebsite = (id: string) => {
    setSelectedWebsite(id);
    fetchServices(id);
  };

  const handleAddService = async () => {
    if (!selectedWebsite || !serviceForm.name) return;
    await addService(selectedWebsite, serviceForm.name, serviceForm.category, serviceForm.description);
    setServiceForm({ name: "", category: "", description: "" });
  };

  const selectedW = websites.find(w => w.id === selectedWebsite);

  const stats = {
    total: websites.length,
    approved: websites.filter(w => w.status === "approved").length,
    pending: websites.filter(w => w.status === "pending").length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader icon={Globe} title="Websites" subtitle="Manage client websites and lead capture"
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate("/domains")}><Globe className="h-4 w-4 mr-1" /> Domains</Button>
            <Button size="sm" variant="outline" onClick={() => navigate("/hosting")}><Server className="h-4 w-4 mr-1" /> Hosting</Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add Website</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Sites" value={stats.total} icon={Globe} gradient="from-primary to-accent" />
        <StatCard title="Approved" value={stats.approved} icon={CheckCircle} gradient="from-[hsl(var(--success))] to-[hsl(var(--neon-green))]" />
        <StatCard title="Pending" value={stats.pending} icon={Clock} gradient="from-[hsl(var(--warning))] to-[hsl(var(--neon-orange))]" />
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : (
        <div className="space-y-3">
          {websites.map(w => (
            <Card
              key={w.id}
              className={`rounded-2xl cursor-pointer transition-all hover:shadow-md ${selectedWebsite === w.id ? "border-primary/50 shadow-md" : ""}`}
              onClick={() => handleSelectWebsite(w.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{w.website_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{w.domain}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="secondary" className={statusColors[w.status] || ""}>{w.status}</Badge>
                    </div>
                    {(w as any).api_key_plain && (
                      <div className="flex items-center gap-1 mt-2">
                        <Key className="h-3 w-3 text-primary shrink-0" />
                        <code className="text-[10px] bg-muted px-2 py-0.5 rounded border text-[hsl(var(--success))] select-all break-all">{(w as any).api_key_plain}</code>
                        <Button size="icon" variant="ghost" className="h-5 w-5 shrink-0" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText((w as any).api_key_plain); toast.success("API key copied!"); }}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {isSuperAdmin && w.status === "pending" && (
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleApprove(w.id); }} className="text-[hsl(var(--success))]">
                        <Shield className="h-3.5 w-3.5 mr-1" /> Approve
                      </Button>
                    )}
                    {isSuperAdmin && w.status === "approved" && (
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); disableWebsite(w.id); }} className="text-destructive">
                        Disable
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {websites.length === 0 && (
            <Card className="rounded-2xl"><CardContent className="py-8 text-center text-muted-foreground">No websites yet. Add one to get started.</CardContent></Card>
          )}
        </div>
      )}

      {selectedW && (
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <Tabs defaultValue="details">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="embed">Embed Code</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-3 mt-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-muted-foreground text-xs">Domain</p><p>{selectedW.domain}</p></div>
                  <div><p className="text-muted-foreground text-xs">Status</p><Badge className={statusColors[selectedW.status]}>{selectedW.status}</Badge></div>
                  <div><p className="text-muted-foreground text-xs">Call Window</p><p className="flex items-center gap-1"><Clock className="h-3 w-3" />{selectedW.call_allowed_start_time || "09:00"} – {selectedW.call_allowed_end_time || "17:00"}</p></div>
                  <div><p className="text-muted-foreground text-xs">Timezone</p><p>{selectedW.timezone || "Australia/Sydney"}</p></div>
                </div>
              </TabsContent>

              <TabsContent value="services" className="space-y-3 mt-3">
                <div className="flex gap-2">
                  <Input placeholder="Service name" value={serviceForm.name} onChange={e => setServiceForm(p => ({...p, name: e.target.value}))} />
                  <Input placeholder="Category" value={serviceForm.category} onChange={e => setServiceForm(p => ({...p, category: e.target.value}))} />
                  <Button size="sm" onClick={handleAddService} className="shrink-0"><Plus className="h-4 w-4" /></Button>
                </div>
                {services.map(s => (
                  <div key={s.id} className="flex items-center justify-between py-2 px-3 bg-muted rounded-xl">
                    <div>
                      <p className="text-sm">{s.service_name}</p>
                      {s.service_category && <p className="text-xs text-muted-foreground">{s.service_category}</p>}
                    </div>
                    <Button size="sm" variant="ghost" className="text-destructive h-7" onClick={() => removeService(s.id, selectedW.id)}>Remove</Button>
                  </div>
                ))}
                {services.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">No services added yet.</p>}
              </TabsContent>

              <TabsContent value="embed" className="mt-3">
                <EmbedCodeBlock domain={selectedW.domain} apiKeyPlain={(selectedW as any).api_key_plain || null} apiKeyLast4={selectedW.api_key_last4} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Website</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Website Name</Label><Input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} /></div>
            <div><Label>Domain</Label><Input value={form.domain} onChange={e => setForm(p => ({...p, domain: e.target.value}))} placeholder="example.com" /></div>
            <Button onClick={handleCreate} className="w-full">Submit for Approval</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={apiKeyModal.open} onOpenChange={(o) => { if (!o) setApiKeyModal({ open: false, key: "" }); }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Key className="h-5 w-5 text-primary" /> API Key Generated</DialogTitle></DialogHeader>
          <p className="text-sm text-[hsl(var(--success))]">✅ This key is saved and always visible on each website card.</p>
          <div className="flex items-center gap-2 mt-2">
            <code className="flex-1 p-3 bg-muted rounded-xl border text-xs text-[hsl(var(--success))] break-all select-all">{apiKeyModal.key}</code>
            <Button size="icon" variant="outline" onClick={handleCopy} className="shrink-0">
              {copied ? <Check className="h-4 w-4 text-[hsl(var(--success))]" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function EmbedCodeBlock({ domain, apiKeyPlain, apiKeyLast4 }: { domain: string; apiKeyPlain: string | null; apiKeyLast4: string | null }) {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const endpoint = `https://${projectId}.supabase.co/functions/v1/website-lead-capture`;
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const displayKey = apiKeyPlain || "API_KEY_HERE";
  const keyNote = apiKeyPlain ? "" : ` // Replace with your API key (last4: ${apiKeyLast4 || "????"})`;

  const embedCode = `<!-- NextWeb OS Lead Capture Form -->
<script>
const NEXTWEB_CONFIG = {
  endpoint: "${endpoint}",
  apiKey: "${displayKey}",${keyNote}
  testMode: false
};
</script>
<div id="nextweb-form"></div>
<script>
(function(){
  var f=document.getElementById('nextweb-form');
  f.innerHTML='<form id="nw-form" style="max-width:480px;font-family:system-ui,sans-serif">'
    +'<div style="margin-bottom:12px"><label style="display:block;font-size:14px;margin-bottom:4px;color:#333">Name *</label><input name="name" required style="width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;font-size:14px" /></div>'
    +'<div style="margin-bottom:12px"><label style="display:block;font-size:14px;margin-bottom:4px;color:#333">Email *</label><input name="email" type="email" required style="width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;font-size:14px" /></div>'
    +'<div style="margin-bottom:12px"><label style="display:block;font-size:14px;margin-bottom:4px;color:#333">Phone *</label><input name="phone" type="tel" required style="width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;font-size:14px" /></div>'
    +'<div style="margin-bottom:12px"><label style="display:block;font-size:14px;margin-bottom:4px;color:#333">Service</label><input name="service_requested" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;font-size:14px" /></div>'
    +'<div style="margin-bottom:12px"><label style="display:block;font-size:14px;margin-bottom:4px;color:#333">Message</label><textarea name="message" rows="3" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;font-size:14px;resize:vertical"></textarea></div>'
    +'<button type="submit" id="nw-submit" style="width:100%;padding:12px;background:#d4a853;color:#fff;border:none;border-radius:6px;font-size:16px;font-weight:600;cursor:pointer">Get a Quote</button>'
    +'<div id="nw-msg" style="margin-top:10px;text-align:center;font-size:14px"></div>'
    +'</form>';
  var form=document.getElementById('nw-form');
  form.addEventListener('submit',function(e){
    e.preventDefault();
    var btn=document.getElementById('nw-submit');
    var msg=document.getElementById('nw-msg');
    btn.disabled=true;btn.textContent='Sending...';msg.textContent='';
    var fd=new FormData(form);
    var params=new URLSearchParams(window.location.search);
    var body={
      api_key:NEXTWEB_CONFIG.apiKey,
      name:fd.get('name'),email:fd.get('email'),phone:fd.get('phone'),
      service_requested:fd.get('service_requested')||'',
      message:fd.get('message')||'',
      page_url:window.location.href,
      utm_source:params.get('utm_source')||'',
      utm_medium:params.get('utm_medium')||'',
      utm_campaign:params.get('utm_campaign')||'',
      gclid:params.get('gclid')||''
    };
    if(NEXTWEB_CONFIG.testMode)body.is_demo=true;
    fetch(NEXTWEB_CONFIG.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
    .then(function(r){return r.json().then(function(d){return{ok:r.ok,data:d}})})
    .then(function(res){
      if(res.ok){msg.style.color='#16a34a';msg.textContent='Thank you! We will be in touch shortly.';form.reset();}
      else{msg.style.color='#dc2626';msg.textContent=res.data.error||'Something went wrong.';}
    })
    .catch(function(){msg.style.color='#dc2626';msg.textContent='Network error. Please try again.';})
    .finally(function(){btn.disabled=false;btn.textContent='Get a Quote';});
  });
})();
</script>`;

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    toast.success("Embed code copied!");
    setTimeout(() => setCopiedEmbed(false), 3000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Copy and paste this into your website HTML</p>
        <Button size="sm" variant="outline" onClick={handleCopyEmbed}>
          {copiedEmbed ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />} Copy
        </Button>
      </div>
      <pre className="p-3 bg-muted rounded-xl border text-xs text-muted-foreground overflow-x-auto max-h-64 whitespace-pre-wrap">
        {embedCode}
      </pre>
      {!apiKeyPlain && <p className="text-xs text-[hsl(var(--warning))]">⚠️ Replace <code>API_KEY_HERE</code> with the actual API key provided by your administrator.</p>}
      {apiKeyPlain && <p className="text-xs text-[hsl(var(--success))]">✅ API key is pre-filled. You can copy and paste this directly.</p>}
    </div>
  );
};

export default WebsitesPage;
