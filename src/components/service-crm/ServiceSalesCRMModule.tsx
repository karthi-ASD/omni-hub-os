import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLeads } from "@/hooks/useLeads";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Plus, FileText, Send, CheckCircle, Clock, ArrowRight,
  DollarSign, Zap, Mail, MessageSquare, Headphones,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const PROPOSAL_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-muted text-muted-foreground" },
  sent: { label: "Sent", color: "bg-blue-500/10 text-blue-600" },
  viewed: { label: "Viewed", color: "bg-purple-500/10 text-purple-600" },
  accepted: { label: "Accepted", color: "bg-green-500/10 text-green-600" },
  rejected: { label: "Rejected", color: "bg-red-500/10 text-red-600" },
  expired: { label: "Expired", color: "bg-yellow-500/10 text-yellow-600" },
};

export function ServiceSalesCRMModule() {
  const { profile, selectedTenantId } = useAuth();
  const businessId = profile?.business_id;
  const { leads } = useLeads();
  const qc = useQueryClient();
  const [subTab, setSubTab] = useState("proposals");
  const [createOpen, setCreateOpen] = useState(false);

  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ["service-proposals", businessId],
    queryFn: async () => {
      const { data } = await supabase
        .from("proposals")
        .select("*")
        .eq("business_id", businessId!)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!businessId,
  });

  const activeLeads = leads.filter(l => !["won", "lost"].includes(l.stage));

  const [form, setForm] = useState({
    lead_id: "", title: "", system_size: "", total_amount: "",
    installation_timeline: "", proposal_notes: "", valid_days: "30",
  });

  const handleCreate = async () => {
    if (!form.title.trim()) { toast.error("Title required"); return; }

    const selectedLead = leads.find(l => l.id === form.lead_id);

    const { error } = await supabase.from("proposals").insert({
      business_id: businessId!,
      lead_id: form.lead_id || null,
      title: form.title,
      total_amount: form.total_amount ? parseFloat(form.total_amount) : 0,
      system_size: form.system_size || null,
      installation_timeline: form.installation_timeline || null,
      proposal_notes: form.proposal_notes || null,
      client_name: selectedLead?.name || null,
      client_email: selectedLead?.email || null,
      client_phone: selectedLead?.phone || null,
      status: "draft",
      valid_until: form.valid_days ? new Date(Date.now() + parseInt(form.valid_days) * 86400000).toISOString().split("T")[0] : null,
      created_by_user_id: profile!.user_id,
      currency: "AUD",
    } as any);

    if (error) { toast.error("Failed to create proposal"); return; }
    toast.success("Proposal created");
    setCreateOpen(false);
    setForm({ lead_id: "", title: "", system_size: "", total_amount: "", installation_timeline: "", proposal_notes: "", valid_days: "30" });
    qc.invalidateQueries({ queryKey: ["service-proposals"] });
  };

  const markSent = async (id: string, via: string) => {
    const { error } = await supabase.from("proposals").update({
      status: "sent",
      sent_at: new Date().toISOString(),
      sent_via: via,
    } as any).eq("id", id);
    if (error) { toast.error("Failed to update"); return; }
    toast.success(`Proposal marked as sent via ${via}`);
    qc.invalidateQueries({ queryKey: ["service-proposals"] });
  };

  const markApproved = async (id: string) => {
    const proposal = proposals.find((p: any) => p.id === id);
    const { error } = await supabase.from("proposals").update({
      status: "accepted",
      approved_at: new Date().toISOString(),
    } as any).eq("id", id);
    if (error) { toast.error("Failed to update"); return; }
    toast.success("Proposal approved! Conversion flow triggered.");

    // Auto-convert linked lead to "won" and create client record
    if (proposal && (proposal as any).lead_id) {
      const leadId = (proposal as any).lead_id;
      await supabase.from("leads").update({ stage: "won" }).eq("id", leadId);

      // Get lead data to create client
      const { data: leadData } = await supabase.from("leads").select("*").eq("id", leadId).maybeSingle();
      if (leadData && businessId) {
        const { error: clientErr } = await supabase.from("clients").insert({
          business_id: businessId,
          contact_name: leadData.name,
          email: leadData.email,
          phone: leadData.phone,
          mobile: leadData.phone,
          company_name: leadData.business_name || leadData.name,
          city: leadData.suburb || null,
          lead_source: leadData.source || "crm",
          onboarding_status: "pending",
        });
        if (!clientErr) {
          toast.success("Client profile created from lead");
        }
      }
    }

    qc.invalidateQueries({ queryKey: ["service-proposals"] });
  };

  const stats = useMemo(() => ({
    total: proposals.length,
    draft: proposals.filter((p: any) => p.status === "draft").length,
    sent: proposals.filter((p: any) => p.status === "sent").length,
    accepted: proposals.filter((p: any) => p.status === "accepted").length,
    totalValue: proposals.reduce((sum: number, p: any) => sum + (p.total_amount || 0), 0),
  }), [proposals]);

  const filteredProposals = useMemo(() => {
    switch (subTab) {
      case "proposals": return proposals;
      case "quotes": return proposals.filter((p: any) => p.status === "draft");
      case "followups": return proposals.filter((p: any) => p.status === "sent");
      case "conversions": return proposals.filter((p: any) => p.status === "accepted");
      default: return proposals;
    }
  }, [proposals, subTab]);

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total Proposals", val: stats.total, icon: FileText },
          { label: "Drafts", val: stats.draft, icon: Clock },
          { label: "Sent", val: stats.sent, icon: Send },
          { label: "Accepted", val: stats.accepted, icon: CheckCircle },
          { label: "Total Value", val: `$${stats.totalValue.toLocaleString()}`, icon: DollarSign },
        ].map(s => (
          <Card key={s.label} className="bg-card border-border">
            <CardContent className="p-3 flex items-center gap-3">
              <s.icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-lg font-bold text-foreground">{s.val}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Controls */}
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />Create Proposal
        </Button>
      </div>

      {/* Sub-tabs */}
      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="proposals" className="text-xs gap-1.5"><FileText className="h-3 w-3" />All Proposals</TabsTrigger>
          <TabsTrigger value="quotes" className="text-xs gap-1.5"><Clock className="h-3 w-3" />Quotes (Draft)</TabsTrigger>
          <TabsTrigger value="followups" className="text-xs gap-1.5"><Send className="h-3 w-3" />Sent / Follow-up</TabsTrigger>
          <TabsTrigger value="conversions" className="text-xs gap-1.5"><CheckCircle className="h-3 w-3" />Conversions</TabsTrigger>
        </TabsList>

        <TabsContent value={subTab} className="mt-4">
          {filteredProposals.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center text-muted-foreground text-sm">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No proposals in this view
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>System</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProposals.map((p: any) => {
                    const statusCfg = PROPOSAL_STATUS_CONFIG[p.status] || { label: p.status, color: "" };
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium text-sm">{p.title}</TableCell>
                        <TableCell className="text-xs">{p.client_name || "—"}</TableCell>
                        <TableCell className="text-xs">{p.system_size || "—"}</TableCell>
                        <TableCell className="text-sm font-medium">${(p.total_amount || 0).toLocaleString()}</TableCell>
                        <TableCell><Badge className={`text-[10px] ${statusCfg.color}`}>{statusCfg.label}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{format(new Date(p.created_at), "dd MMM yyyy")}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {p.status === "draft" && (
                              <>
                                <Button size="sm" variant="ghost" onClick={() => markSent(p.id, "email")} className="h-7 text-[10px] gap-1"><Mail className="h-3 w-3" />Email</Button>
                                <Button size="sm" variant="ghost" onClick={() => markSent(p.id, "whatsapp")} className="h-7 text-[10px] gap-1"><MessageSquare className="h-3 w-3" />WA</Button>
                              </>
                            )}
                            {p.status === "sent" && (
                              <Button size="sm" variant="ghost" onClick={() => markApproved(p.id)} className="h-7 text-[10px] gap-1 text-green-600"><CheckCircle className="h-3 w-3" />Approve</Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Proposal Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Proposal</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div><Label className="text-xs">Link to Lead</Label>
              <Select value={form.lead_id} onValueChange={v => setForm(f => ({ ...f, lead_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select lead (optional)" /></SelectTrigger>
                <SelectContent>
                  {activeLeads.map(l => <SelectItem key={l.id} value={l.id}>{l.name} — {l.email}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Proposal Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. 6.6kW Solar System Proposal" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">System Size</Label><Input value={form.system_size} onChange={e => setForm(f => ({ ...f, system_size: e.target.value }))} placeholder="e.g. 6.6kW" /></div>
              <div><Label className="text-xs">Total Amount ($)</Label><Input type="number" value={form.total_amount} onChange={e => setForm(f => ({ ...f, total_amount: e.target.value }))} placeholder="e.g. 8500" /></div>
              <div><Label className="text-xs">Installation Timeline</Label><Input value={form.installation_timeline} onChange={e => setForm(f => ({ ...f, installation_timeline: e.target.value }))} placeholder="e.g. 2-3 weeks" /></div>
              <div><Label className="text-xs">Valid For (days)</Label><Input type="number" value={form.valid_days} onChange={e => setForm(f => ({ ...f, valid_days: e.target.value }))} /></div>
            </div>
            <div><Label className="text-xs">Notes</Label><Textarea value={form.proposal_notes} onChange={e => setForm(f => ({ ...f, proposal_notes: e.target.value }))} rows={3} /></div>
            <Button onClick={handleCreate} className="w-full">Create Proposal</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
