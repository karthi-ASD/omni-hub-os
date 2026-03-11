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
import { Globe, Plus, Shield, Copy, Check, Clock, Wrench, Key } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500",
  approved: "bg-emerald-500/10 text-emerald-500",
  rejected: "bg-destructive/10 text-destructive",
  disabled: "bg-gray-500/10 text-gray-400",
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

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Globe className="h-6 w-6 text-[#d4a853]" /> Websites
        </h1>
        <Button size="sm" onClick={() => setCreateOpen(true)} className="bg-[#d4a853] hover:bg-[#b8902e] text-[#0a0e1a]">
          <Plus className="h-4 w-4 mr-1" /> Add Website
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : (
        <div className="space-y-3">
          {websites.map(w => (
            <Card
              key={w.id}
              className={`bg-[#111832] border-[#1e2a4a] cursor-pointer transition-all ${selectedWebsite === w.id ? "border-[#d4a853]/50" : ""}`}
              onClick={() => handleSelectWebsite(w.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">{w.website_name}</p>
                    <p className="text-xs text-gray-400 truncate">{w.domain}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="secondary" className={statusColors[w.status] || ""}>{w.status}</Badge>
                    </div>
                    {(w as any).api_key_plain && (
                      <div className="flex items-center gap-1 mt-2">
                        <Key className="h-3 w-3 text-[#d4a853] shrink-0" />
                        <code className="text-[10px] bg-[#0a0e1a] px-2 py-0.5 rounded border border-[#1e2a4a] text-emerald-400 select-all break-all">{(w as any).api_key_plain}</code>
                        <Button size="icon" variant="ghost" className="h-5 w-5 shrink-0" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText((w as any).api_key_plain); toast.success("API key copied!"); }}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {isSuperAdmin && w.status === "pending" && (
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleApprove(w.id); }}
                        className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10">
                        <Shield className="h-3.5 w-3.5 mr-1" /> Approve
                      </Button>
                    )}
                    {isSuperAdmin && w.status === "approved" && (
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); disableWebsite(w.id); }}
                        className="text-red-400 border-red-500/30 hover:bg-red-500/10">
                        Disable
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {websites.length === 0 && (
            <p className="text-center text-gray-500 py-8 text-sm">No websites yet. Add one to get started.</p>
          )}
        </div>
      )}

      {/* Website detail panel */}
      {selectedW && (
        <Card className="bg-[#111832] border-[#1e2a4a]">
          <CardContent className="p-4">
            <Tabs defaultValue="details">
              <TabsList className="bg-[#0a0e1a] border border-[#1e2a4a]">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="embed">Embed Code</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-3 mt-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-gray-500 text-xs">Domain</p><p className="text-white">{selectedW.domain}</p></div>
                  <div><p className="text-gray-500 text-xs">Status</p><Badge className={statusColors[selectedW.status]}>{selectedW.status}</Badge></div>
                  <div><p className="text-gray-500 text-xs">Call Window</p><p className="text-white flex items-center gap-1"><Clock className="h-3 w-3" />{selectedW.call_allowed_start_time || "09:00"} – {selectedW.call_allowed_end_time || "17:00"}</p></div>
                  <div><p className="text-gray-500 text-xs">Timezone</p><p className="text-white">{selectedW.timezone || "Australia/Sydney"}</p></div>
                </div>
              </TabsContent>

              <TabsContent value="services" className="space-y-3 mt-3">
                <div className="flex gap-2">
                  <Input placeholder="Service name" value={serviceForm.name} onChange={e => setServiceForm(p => ({...p, name: e.target.value}))}
                    className="bg-[#0a0e1a] border-[#1e2a4a] text-white text-sm" />
                  <Input placeholder="Category" value={serviceForm.category} onChange={e => setServiceForm(p => ({...p, category: e.target.value}))}
                    className="bg-[#0a0e1a] border-[#1e2a4a] text-white text-sm" />
                  <Button size="sm" onClick={handleAddService} className="bg-[#d4a853] hover:bg-[#b8902e] text-[#0a0e1a] shrink-0">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {services.map(s => (
                  <div key={s.id} className="flex items-center justify-between py-2 px-3 bg-[#0a0e1a] rounded-lg border border-[#1e2a4a]">
                    <div>
                      <p className="text-sm text-white">{s.service_name}</p>
                      {s.service_category && <p className="text-xs text-gray-500">{s.service_category}</p>}
                    </div>
                    <Button size="sm" variant="ghost" className="text-red-400 h-7" onClick={() => removeService(s.id, selectedW.id)}>Remove</Button>
                  </div>
                ))}
                {services.length === 0 && <p className="text-gray-500 text-sm text-center py-4">No services added yet.</p>}
              </TabsContent>

              <TabsContent value="embed" className="mt-3">
                <EmbedCodeBlock domain={selectedW.domain} apiKeyPlain={(selectedW as any).api_key_plain || null} apiKeyLast4={selectedW.api_key_last4} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-[#111832] border-[#1e2a4a] text-white">
          <DialogHeader><DialogTitle>Add Website</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-gray-400">Website Name</Label><Input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} className="bg-[#0a0e1a] border-[#1e2a4a] text-white" /></div>
            <div><Label className="text-gray-400">Domain</Label><Input value={form.domain} onChange={e => setForm(p => ({...p, domain: e.target.value}))} placeholder="example.com" className="bg-[#0a0e1a] border-[#1e2a4a] text-white" /></div>
            <Button onClick={handleCreate} className="w-full bg-[#d4a853] hover:bg-[#b8902e] text-[#0a0e1a]">Submit for Approval</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* API Key modal */}
      <Dialog open={apiKeyModal.open} onOpenChange={(o) => { if (!o) setApiKeyModal({ open: false, key: "" }); }}>
        <DialogContent className="bg-[#111832] border-[#1e2a4a] text-white">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Key className="h-5 w-5 text-[#d4a853]" /> API Key Generated</DialogTitle></DialogHeader>
          <p className="text-sm text-emerald-400">✅ This key is saved and always visible on each website card.</p>
          <div className="flex items-center gap-2 mt-2">
            <code className="flex-1 p-3 bg-[#0a0e1a] rounded-lg border border-[#1e2a4a] text-xs text-emerald-400 break-all select-all">{apiKeyModal.key}</code>
            <Button size="icon" variant="outline" onClick={handleCopy} className="border-[#1e2a4a] shrink-0">
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
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
        <p className="text-sm text-gray-400">Copy and paste this into your website HTML</p>
        <Button size="sm" variant="outline" onClick={handleCopyEmbed} className="border-[#1e2a4a] text-[#d4a853]">
          {copiedEmbed ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />} Copy
        </Button>
      </div>
      <pre className="p-3 bg-[#0a0e1a] rounded-lg border border-[#1e2a4a] text-xs text-gray-300 overflow-x-auto max-h-64 whitespace-pre-wrap">
        {embedCode}
      </pre>
      {!apiKeyPlain && <p className="text-xs text-yellow-400">⚠️ Replace <code>API_KEY_HERE</code> with the actual API key provided by your administrator.</p>}
      {apiKeyPlain && <p className="text-xs text-emerald-400">✅ API key is pre-filled. You can copy and paste this directly.</p>}
    </div>
  );
};

export default WebsitesPage;
