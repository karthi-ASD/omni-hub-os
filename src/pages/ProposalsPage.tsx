import { useState } from "react";
import { useProposals, ServiceLineItem, Proposal } from "@/hooks/useProposals";
import { useContracts } from "@/hooks/useContracts";
import { useDeals, Deal } from "@/hooks/useDeals";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Plus, Send, Check, X, Eye, Trash2, DollarSign, FileSignature } from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/10 text-blue-600",
  viewed: "bg-cyan-500/10 text-cyan-600",
  accepted: "bg-green-500/10 text-green-600",
  rejected: "bg-destructive/10 text-destructive",
  expired: "bg-amber-500/10 text-amber-600",
};

const ProposalsPage = () => {
  const { proposals, loading, createProposal, sendProposal, acceptProposal, rejectProposal, markPaid } = useProposals();
  const { createFromProposal } = useContracts();
  const { deals } = useDeals();
  const { profile } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState<Proposal | null>(null);

  // Form state
  const [form, setForm] = useState({ deal_id: "", title: "", description: "", valid_until: "", payment_required: false });
  const [services, setServices] = useState<ServiceLineItem[]>([{ description: "", quantity: 1, unit_price: 0, total: 0 }]);

  const openDeals = deals.filter(d => d.status === "open");

  const updateService = (idx: number, field: keyof ServiceLineItem, value: any) => {
    setServices(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      updated[idx].total = updated[idx].quantity * updated[idx].unit_price;
      return updated;
    });
  };

  const handleCreate = async () => {
    const validServices = services.filter(s => s.description && s.total > 0);
    await createProposal({
      deal_id: form.deal_id,
      title: form.title,
      description: form.description || undefined,
      services: validServices,
      valid_until: form.valid_until || undefined,
      payment_required: form.payment_required,
    });
    setCreateOpen(false);
    setForm({ deal_id: "", title: "", description: "", valid_until: "", payment_required: false });
    setServices([{ description: "", quantity: 1, unit_price: 0, total: 0 }]);
  };

  const handleGenerateContract = async (proposal: Proposal) => {
    const content = `<h1>${proposal.title}</h1>
<p>${proposal.description || ""}</p>
<h2>Services</h2>
<ul>${(proposal.services_json || []).map((s: any) => `<li>${s.description} - $${s.total}</li>`).join("")}</ul>
<p><strong>Total: $${proposal.total_amount} ${proposal.currency}</strong></p>
<p>Valid until: ${proposal.valid_until || "N/A"}</p>`;
    await createFromProposal(proposal.id, proposal.deal_id, content);
    setDetailOpen(null);
  };

  const subtotal = services.reduce((sum, s) => sum + s.total, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6" /> Proposals</h1>
          <p className="text-muted-foreground">Create and manage sales proposals</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm"><Plus className="h-4 w-4 mr-1" /> New Proposal</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : proposals.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No proposals yet. Create one from a deal.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {proposals.map(p => (
            <Card key={p.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setDetailOpen(p)}>
              <CardContent className="flex items-center gap-4 py-3 px-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{p.title}</p>
                  <p className="text-xs text-muted-foreground">#{p.proposal_number} · ${Number(p.total_amount).toLocaleString()} {p.currency} · {format(new Date(p.created_at), "MMM d, yyyy")}</p>
                </div>
                <Badge className={statusColors[p.status]}>{p.status}</Badge>
                {p.payment_required && <Badge variant="outline" className="text-xs">{p.payment_status}</Badge>}
                <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                  {p.status === "draft" && <Button variant="ghost" size="sm" onClick={() => sendProposal(p.id)}><Send className="h-4 w-4" /></Button>}
                  {p.status === "sent" && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => acceptProposal(p.id)}><Check className="h-4 w-4 text-primary" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => rejectProposal(p.id)}><X className="h-4 w-4 text-destructive" /></Button>
                    </>
                  )}
                  {p.status === "accepted" && <Button variant="ghost" size="sm" onClick={() => handleGenerateContract(p)}><FileSignature className="h-4 w-4" /></Button>}
                  {p.payment_required && p.payment_status === "unpaid" && (
                    <Button variant="ghost" size="sm" onClick={() => markPaid(p.id)}><DollarSign className="h-4 w-4" /></Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(["draft", "sent", "accepted", "rejected"] as const).map(s => (
          <Card key={s}>
            <CardHeader className="pb-2"><CardTitle className="text-sm capitalize text-muted-foreground">{s}</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{proposals.filter(p => p.status === s).length}</p></CardContent>
          </Card>
        ))}
      </div>

      {/* CREATE PROPOSAL */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Proposal</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Deal *</Label>
              <Select value={form.deal_id} onValueChange={v => setForm(p => ({ ...p, deal_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select a deal" /></SelectTrigger>
                <SelectContent>{openDeals.map(d => <SelectItem key={d.id} value={d.id}>{d.deal_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>

            <div>
              <Label>Services</Label>
              {services.map((s, i) => (
                <div key={i} className="flex gap-2 mt-2 items-end">
                  <div className="flex-1"><Input placeholder="Description" value={s.description} onChange={e => updateService(i, "description", e.target.value)} /></div>
                  <div className="w-16"><Input type="number" placeholder="Qty" value={s.quantity} onChange={e => updateService(i, "quantity", Number(e.target.value))} /></div>
                  <div className="w-24"><Input type="number" placeholder="Price" value={s.unit_price} onChange={e => updateService(i, "unit_price", Number(e.target.value))} /></div>
                  <div className="w-20 text-sm font-medium pt-2">${s.total.toLocaleString()}</div>
                  {services.length > 1 && <Button variant="ghost" size="icon" onClick={() => setServices(prev => prev.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>}
                </div>
              ))}
              <Button variant="outline" size="sm" className="mt-2" onClick={() => setServices(prev => [...prev, { description: "", quantity: 1, unit_price: 0, total: 0 }])}>
                <Plus className="h-4 w-4 mr-1" /> Add Service
              </Button>
              <p className="text-sm font-medium mt-2">Subtotal: ${subtotal.toLocaleString()}</p>
            </div>

            <div><Label>Valid Until</Label><Input type="date" value={form.valid_until} onChange={e => setForm(p => ({ ...p, valid_until: e.target.value }))} /></div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.payment_required} onChange={e => setForm(p => ({ ...p, payment_required: e.target.checked }))} />
              <Label>Payment required</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.deal_id || !form.title}>Create Proposal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PROPOSAL DETAIL */}
      <Dialog open={!!detailOpen} onOpenChange={() => setDetailOpen(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{detailOpen?.title}</DialogTitle></DialogHeader>
          {detailOpen && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge className={statusColors[detailOpen.status]}>{detailOpen.status}</Badge></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-medium">${Number(detailOpen.total_amount).toLocaleString()} {detailOpen.currency}</span></div>
              {detailOpen.valid_until && <div className="flex justify-between"><span className="text-muted-foreground">Valid Until</span><span>{detailOpen.valid_until}</span></div>}
              {detailOpen.description && <p className="text-muted-foreground">{detailOpen.description}</p>}
              <div>
                <p className="font-medium mb-1">Services:</p>
                {(detailOpen.services_json || []).map((s: any, i: number) => (
                  <div key={i} className="flex justify-between text-xs py-1 border-b last:border-0">
                    <span>{s.description} (x{s.quantity})</span>
                    <span>${s.total}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProposalsPage;
