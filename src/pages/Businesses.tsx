import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Building2, Ban, CheckCircle, Pencil, Globe, Shield, Key, Plus, Copy, Check, ArrowLeft, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CreateBusinessDialog from "@/components/business/CreateBusinessDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import type { Tables } from "@/integrations/supabase/types";

type Business = Tables<"businesses">;

interface TenantWebsite {
  id: string;
  business_id: string;
  website_name: string;
  domain: string;
  status: string;
  api_key_hash: string | null;
  api_key_last4: string | null;
  call_allowed_start_time: string | null;
  call_allowed_end_time: string | null;
  timezone: string | null;
  created_at: string;
}

const Businesses = () => {
  const { isSuperAdmin, profile } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [editBiz, setEditBiz] = useState<Business | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  // Business detail view
  const [selectedBiz, setSelectedBiz] = useState<Business | null>(null);
  const [bizWebsites, setBizWebsites] = useState<TenantWebsite[]>([]);
  const [bizUsers, setBizUsers] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // API key modal
  const [apiKeyModal, setApiKeyModal] = useState<{ open: boolean; key: string }>({ open: false, key: "" });
  const [copied, setCopied] = useState(false);

  // Add website form
  const [addWebOpen, setAddWebOpen] = useState(false);
  const [webForm, setWebForm] = useState({ name: "", domain: "" });

  const fetchBusinesses = async () => {
    const { data, error } = await supabase
      .from("businesses")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Failed to load businesses");
    else setBusinesses(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchBusinesses(); }, []);

  const toggleStatus = async (biz: Business) => {
    const newStatus = biz.status === "active" ? "suspended" : "active";
    const { error } = await supabase.from("businesses").update({ status: newStatus }).eq("id", biz.id);
    if (error) { toast.error("Failed to update status"); return; }
    toast.success(`Business ${newStatus}`);
    if (profile) {
      await supabase.from("audit_logs").insert({
        business_id: biz.id, actor_user_id: profile.user_id,
        action_type: newStatus === "suspended" ? "SUSPEND_BUSINESS" : "REACTIVATE_BUSINESS",
        entity_type: "business", entity_id: biz.id, new_value_json: { status: newStatus },
      });
    }
    fetchBusinesses();
  };

  const openEdit = (biz: Business) => { setEditBiz(biz); setEditName(biz.name); };

  const saveEdit = async () => {
    if (!editBiz || !editName.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("businesses").update({ name: editName.trim() }).eq("id", editBiz.id);
    if (error) { toast.error("Failed to update business"); setSaving(false); return; }
    toast.success("Business updated");
    if (profile) {
      await supabase.from("audit_logs").insert({
        business_id: editBiz.id, actor_user_id: profile.user_id,
        action_type: "UPDATE_BUSINESS", entity_type: "business", entity_id: editBiz.id,
        old_value_json: { name: editBiz.name }, new_value_json: { name: editName.trim() },
      });
    }
    setEditBiz(null); setSaving(false); fetchBusinesses();
  };

  // Business detail
  const openBusinessDetail = async (biz: Business) => {
    setSelectedBiz(biz);
    setLoadingDetail(true);
    const [{ data: websites }, { data: profiles }] = await Promise.all([
      supabase.from("tenant_websites").select("*").eq("business_id", biz.id).order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, user_id, full_name, email, created_at").eq("business_id", biz.id).order("created_at", { ascending: false }),
    ]);
    setBizWebsites((websites as TenantWebsite[]) || []);
    setBizUsers(profiles || []);
    setLoadingDetail(false);
  };

  const approveWebsite = async (websiteId: string, businessId: string) => {
    if (!profile) return;
    const rawKey = crypto.randomUUID() + "-" + crypto.randomUUID();
    const last4 = rawKey.slice(-4);
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(rawKey));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const keyHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    const { error } = await supabase.from("tenant_websites").update({
      status: "approved", api_key_hash: keyHash, api_key_last4: last4,
      api_key_plain: rawKey,
      approved_by: profile.user_id, approved_at: new Date().toISOString(),
    } as any).eq("id", websiteId);

    if (error) { toast.error("Failed to approve"); return; }

    await supabase.from("system_events").insert({
      business_id: businessId, event_type: "WEBSITE_APPROVED",
      payload_json: { entity_type: "tenant_website", entity_id: websiteId, short_message: "Website domain approved" },
    });

    toast.success("Website approved!");
    setApiKeyModal({ open: true, key: rawKey });
    if (selectedBiz) openBusinessDetail(selectedBiz);
  };

  const disableWebsite = async (websiteId: string) => {
    const { error } = await supabase.from("tenant_websites").update({ status: "disabled" }).eq("id", websiteId);
    if (error) { toast.error("Failed to disable"); return; }
    toast.success("Website disabled");
    if (selectedBiz) openBusinessDetail(selectedBiz);
  };

  const handleAddWebsite = async () => {
    if (!selectedBiz || !webForm.name || !webForm.domain) return;
    const { error } = await supabase.from("tenant_websites").insert({
      business_id: selectedBiz.id, website_name: webForm.name, domain: webForm.domain,
      status: "pending", created_by: profile?.user_id || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Website added");
    setWebForm({ name: "", domain: "" });
    setAddWebOpen(false);
    openBusinessDetail(selectedBiz);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKeyModal.key);
    setCopied(true);
    toast.success("API key copied!");
    setTimeout(() => setCopied(false), 3000);
  };

  if (!isSuperAdmin) return <p className="text-muted-foreground">Access denied</p>;

  // Business detail view
  if (selectedBiz) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedBiz(null)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#d4a853]" /> {selectedBiz.name}
            </h1>
            <Badge variant={selectedBiz.status === "active" ? "default" : "destructive"} className="mt-1">{selectedBiz.status}</Badge>
          </div>
        </div>

        <Tabs defaultValue="details">
          <TabsList className="bg-[#0a0e1a] border border-[#1e2a4a]">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="users">Users ({bizUsers.length})</TabsTrigger>
            <TabsTrigger value="websites">Websites ({bizWebsites.length})</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-3 mt-3">
            <Card className="bg-[#111832] border-[#1e2a4a]">
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-gray-500 text-xs">Business ID</p><p className="text-white font-mono text-xs">{selectedBiz.id}</p></div>
                  <div><p className="text-gray-500 text-xs">Created</p><p className="text-white">{new Date(selectedBiz.created_at).toLocaleDateString()}</p></div>
                  <div><p className="text-gray-500 text-xs">Status</p><Badge variant={selectedBiz.status === "active" ? "default" : "destructive"}>{selectedBiz.status}</Badge></div>
                  <div><p className="text-gray-500 text-xs">Slug</p><p className="text-white font-mono text-xs">{(selectedBiz as any).slug || "—"}</p></div>
                </div>

                {/* Company Portal URLs */}
                {(selectedBiz as any).slug && (
                  <div className="mt-4 p-3 rounded-lg bg-[#0a0e1a] border border-[#1e2a4a] space-y-2">
                    <p className="text-xs font-semibold text-[#d4a853] flex items-center gap-1"><Globe className="h-3 w-3" /> Company Portal URLs</p>
                    {[
                      { label: "Login URL", path: `/company/${(selectedBiz as any).slug}/login` },
                      { label: "Signup URL", path: `/company/${(selectedBiz as any).slug}/signup` },
                    ].map(({ label, path }) => {
                      const fullUrl = `${window.location.origin}${path}`;
                      return (
                        <div key={label} className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[10px] text-gray-500">{label}</p>
                            <p className="text-xs text-emerald-400 font-mono truncate">{fullUrl}</p>
                          </div>
                          <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => { navigator.clipboard.writeText(fullUrl); toast.success(`${label} copied!`); }}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(selectedBiz)}>
                    <Pencil className="h-3 w-3 mr-1" /> Edit Name
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toggleStatus(selectedBiz)}>
                    {selectedBiz.status === "active" ? <><Ban className="h-3 w-3 mr-1" /> Suspend</> : <><CheckCircle className="h-3 w-3 mr-1" /> Reactivate</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="mt-3">
            {loadingDetail ? <p className="text-gray-500 text-sm py-8 text-center">Loading...</p> : (
              <div className="space-y-2">
                {bizUsers.map((u: any) => (
                  <Card key={u.id} className="bg-[#111832] border-[#1e2a4a]">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{u.full_name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                      <p className="text-xs text-gray-600">{new Date(u.created_at).toLocaleDateString()}</p>
                    </CardContent>
                  </Card>
                ))}
                {bizUsers.length === 0 && <p className="text-gray-500 text-sm text-center py-6">No users in this business.</p>}
              </div>
            )}
          </TabsContent>

          <TabsContent value="websites" className="mt-3 space-y-3">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setAddWebOpen(true)} className="bg-[#d4a853] hover:bg-[#b8902e] text-[#0a0e1a]">
                <Plus className="h-4 w-4 mr-1" /> Add Website
              </Button>
            </div>
            {loadingDetail ? <p className="text-gray-500 text-sm py-8 text-center">Loading...</p> : (
              <div className="space-y-2">
                {bizWebsites.map((w) => (
                  <Card key={w.id} className="bg-[#111832] border-[#1e2a4a]">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white">{w.website_name}</p>
                          <p className="text-xs text-gray-400">{w.domain}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge variant="secondary" className={
                              w.status === "approved" ? "bg-emerald-500/10 text-emerald-500" :
                              w.status === "pending" ? "bg-yellow-500/10 text-yellow-500" :
                              w.status === "disabled" ? "bg-gray-500/10 text-gray-400" :
                              "bg-destructive/10 text-destructive"
                            }>{w.status}</Badge>
                            {(w as any).api_key_plain ? (
                              <div className="flex items-center gap-1 mt-1">
                                <Key className="h-3 w-3 text-[hsl(var(--accent))]" />
                                <code className="text-[10px] bg-[#0a0e1a] px-2 py-0.5 rounded border border-[#1e2a4a] text-emerald-400 select-all break-all">{(w as any).api_key_plain}</code>
                                <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => { navigator.clipboard.writeText((w as any).api_key_plain); toast.success("API key copied!"); }}>
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : w.api_key_last4 ? (
                              <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                <Key className="h-3 w-3" /> ****{w.api_key_last4}
                              </span>
                            ) : null}
                            {w.call_allowed_start_time && (
                              <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {w.call_allowed_start_time}–{w.call_allowed_end_time}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          {w.status === "pending" && (
                            <Button size="sm" variant="outline" onClick={() => approveWebsite(w.id, w.business_id)}
                              className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10">
                              <Shield className="h-3.5 w-3.5 mr-1" /> Approve
                            </Button>
                          )}
                          {w.status === "approved" && (
                            <Button size="sm" variant="outline" onClick={() => disableWebsite(w.id)}
                              className="text-red-400 border-red-500/30 hover:bg-red-500/10">
                              Disable
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {bizWebsites.length === 0 && <p className="text-gray-500 text-sm text-center py-6">No websites for this business.</p>}
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="mt-3">
            <Card className="bg-[#111832] border-[#1e2a4a]">
              <CardContent className="p-4 text-gray-400 text-sm">
                Business settings and configuration options are managed via the Settings page per tenant.
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Website Dialog */}
        <Dialog open={addWebOpen} onOpenChange={setAddWebOpen}>
          <DialogContent className="bg-[#111832] border-[#1e2a4a] text-white">
            <DialogHeader><DialogTitle>Add Website for {selectedBiz.name}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-gray-400">Website Name</Label><Input value={webForm.name} onChange={e => setWebForm(p => ({...p, name: e.target.value}))} className="bg-[#0a0e1a] border-[#1e2a4a] text-white" /></div>
              <div><Label className="text-gray-400">Domain</Label><Input value={webForm.domain} onChange={e => setWebForm(p => ({...p, domain: e.target.value}))} placeholder="example.com" className="bg-[#0a0e1a] border-[#1e2a4a] text-white" /></div>
              <Button onClick={handleAddWebsite} className="w-full bg-[#d4a853] hover:bg-[#b8902e] text-[#0a0e1a]">Add Website</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* API Key Modal */}
        <Dialog open={apiKeyModal.open} onOpenChange={(o) => { if (!o) setApiKeyModal({ open: false, key: "" }); }}>
          <DialogContent className="bg-[#111832] border-[#1e2a4a] text-white">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><Key className="h-5 w-5 text-[#d4a853]" /> API Key Generated</DialogTitle></DialogHeader>
            <p className="text-sm text-emerald-400">✅ This key is saved and always visible in the Websites tab.</p>
            <div className="flex items-center gap-2 mt-2">
              <code className="flex-1 p-3 bg-[#0a0e1a] rounded-lg border border-[#1e2a4a] text-xs text-emerald-400 break-all select-all">{apiKeyModal.key}</code>
              <Button size="icon" variant="outline" onClick={handleCopyKey} className="border-[#1e2a4a] shrink-0">
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editBiz} onOpenChange={(open) => !open && setEditBiz(null)}>
          <DialogContent className="bg-[#111832] border-[#1e2a4a] text-white">
            <DialogHeader><DialogTitle>Edit Business</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-gray-400">Business Name</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-[#0a0e1a] border-[#1e2a4a] text-white" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditBiz(null)}>Cancel</Button>
                <Button onClick={saveEdit} disabled={saving || !editName.trim()} className="bg-[#d4a853] hover:bg-[#b8902e] text-[#0a0e1a]">
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Business list view
  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Building2 className="h-6 w-6 text-[#d4a853]" /> Businesses
        </h1>
        <p className="text-sm text-gray-400">Manage all tenants</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d4a853] border-t-transparent" />
        </div>
      ) : businesses.length === 0 ? (
        <Card className="bg-[#111832] border-[#1e2a4a]">
          <CardContent className="py-12 text-center text-gray-500">No businesses found.</CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {businesses.map((biz) => (
            <Card key={biz.id} className="bg-[#111832] border-[#1e2a4a] hover:border-[#d4a853]/30 transition-all cursor-pointer" onClick={() => openBusinessDetail(biz)}>
              <CardContent className="flex items-center justify-between py-4 px-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-[#1e2a4a] flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-[#d4a853]" />
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm">{biz.name}</p>
                    <p className="text-xs text-gray-500">/{(biz as any).slug} · Created {new Date(biz.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={biz.status === "active" ? "default" : "destructive"}>{biz.status}</Badge>
                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(biz); }} className="border-[#1e2a4a]">
                    <Pencil className="mr-1 h-3 w-3" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); toggleStatus(biz); }} className="border-[#1e2a4a]">
                    {biz.status === "active" ? <><Ban className="mr-1 h-3 w-3" /> Suspend</> : <><CheckCircle className="mr-1 h-3 w-3" /> Reactivate</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editBiz} onOpenChange={(open) => !open && setEditBiz(null)}>
        <DialogContent className="bg-[#111832] border-[#1e2a4a] text-white">
          <DialogHeader><DialogTitle>Edit Business</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-gray-400">Business Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-[#0a0e1a] border-[#1e2a4a] text-white" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditBiz(null)}>Cancel</Button>
              <Button onClick={saveEdit} disabled={saving || !editName.trim()} className="bg-[#d4a853] hover:bg-[#b8902e] text-[#0a0e1a]">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Businesses;
