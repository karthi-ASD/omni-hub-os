import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Mail, Phone } from "lucide-react";
import { toast } from "sonner";

const PARTNER_TYPES: Record<string, string> = {
  broker: "Mortgage Broker", lawyer: "Lawyer / Solicitor", accountant: "Accountant",
  smsf_specialist: "SMSF Specialist", finance_manager: "Finance Manager",
  developer_contact: "Developer Contact", wealth_advisor: "Wealth Advisor",
  referral_partner: "Referral Partner", other: "Other",
};

export function PartnersModule() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  const [form, setForm] = useState({ partner_name: "", company_name: "", partner_type: "broker", email: "", phone: "", specialization: "", relationship_status: "active", notes: "" });

  const { data: partners = [] } = useQuery({
    queryKey: ["crm-partners", profile?.business_id],
    queryFn: async () => { const { data } = await supabase.from("crm_partners").select("*").eq("business_id", profile!.business_id!).order("created_at", { ascending: false }); return data || []; },
    enabled: !!profile?.business_id,
  });

  const filtered = partners.filter((p: any) => {
    if (filterType !== "all" && p.partner_type !== filterType) return false;
    if (search) { const q = search.toLowerCase(); return p.partner_name.toLowerCase().includes(q) || (p.company_name || "").toLowerCase().includes(q); }
    return true;
  });

  const handleSave = async () => {
    if (!form.partner_name.trim()) { toast.error("Name required"); return; }
    const { error } = await supabase.from("crm_partners").insert({ business_id: profile!.business_id!, ...form } as any);
    if (error) { toast.error("Failed"); return; }
    toast.success("Partner added"); setOpen(false);
    qc.invalidateQueries({ queryKey: ["crm-partners"] });
  };

  const typeGroups = Object.entries(PARTNER_TYPES).map(([k, v]) => ({ type: k, label: v, count: partners.filter((p: any) => p.partner_type === k).length }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {typeGroups.filter(g => g.count > 0 || ["broker", "lawyer", "accountant", "smsf_specialist"].includes(g.type)).map(g => (
          <Card key={g.type} className={`bg-card border-border cursor-pointer transition-colors hover:border-primary/30 ${filterType === g.type ? "border-primary" : ""}`} onClick={() => setFilterType(filterType === g.type ? "all" : g.type)}>
            <CardContent className="p-3 text-center"><p className="text-xl font-bold text-foreground">{g.count}</p><p className="text-[10px] text-muted-foreground">{g.label}</p></CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search partners..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" /></div>
        <Button onClick={() => setOpen(true)} size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Add Partner</Button>
      </div>

      <Card className="bg-card border-border"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Company</TableHead><TableHead>Type</TableHead><TableHead>Contact</TableHead><TableHead>Status</TableHead><TableHead>Referrals</TableHead></TableRow></TableHeader><TableBody>
        {filtered.map((p: any) => (
          <TableRow key={p.id}>
            <TableCell className="font-medium">{p.partner_name}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{p.company_name || "—"}</TableCell>
            <TableCell><Badge variant="outline" className="text-[10px]">{PARTNER_TYPES[p.partner_type] || p.partner_type}</Badge></TableCell>
            <TableCell className="text-xs space-y-0.5">{p.email && <div className="flex items-center gap-1"><Mail className="h-3 w-3" />{p.email}</div>}{p.phone && <div className="flex items-center gap-1"><Phone className="h-3 w-3" />{p.phone}</div>}</TableCell>
            <TableCell><Badge variant={p.relationship_status === "active" ? "default" : "secondary"} className="text-[10px]">{p.relationship_status}</Badge></TableCell>
            <TableCell className="text-sm font-medium">{p.referral_count || 0}</TableCell>
          </TableRow>
        ))}
        {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No partners found</TableCell></TableRow>}
      </TableBody></Table></Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>Add Partner</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div><Label className="text-xs">Name *</Label><Input value={form.partner_name} onChange={e => setForm(f => ({ ...f, partner_name: e.target.value }))} /></div>
            <div><Label className="text-xs">Company</Label><Input value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} /></div>
            <div><Label className="text-xs">Type</Label><Select value={form.partner_type} onValueChange={v => setForm(f => ({ ...f, partner_type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(PARTNER_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div><div><Label className="text-xs">Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div></div>
            <div><Label className="text-xs">Specialization</Label><Input value={form.specialization} onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))} /></div>
            <div><Label className="text-xs">Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
            <Button onClick={handleSave} className="w-full">Add Partner</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
