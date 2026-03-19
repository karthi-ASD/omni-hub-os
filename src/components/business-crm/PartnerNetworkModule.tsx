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
import { Plus, Search, Network, User, Briefcase, Phone, Mail } from "lucide-react";
import { toast } from "sonner";

interface Partner {
  id: string;
  partner_name: string;
  company_name: string | null;
  partner_type: string;
  email: string | null;
  phone: string | null;
  specialization: string | null;
  relationship_status: string;
  referral_count: number;
  total_deal_value: number;
  notes: string | null;
  created_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  broker: "Mortgage Broker",
  lawyer: "Lawyer / Conveyancer",
  accountant: "Accountant",
  developer: "Developer",
  finance: "Finance Specialist",
  other: "Other",
};

export function PartnerNetworkModule() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  const [form, setForm] = useState({
    partner_name: "", company_name: "", partner_type: "broker",
    email: "", phone: "", specialization: "", relationship_status: "active",
    notes: "",
  });

  const { data: partners = [] } = useQuery({
    queryKey: ["crm-partners", profile?.business_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("crm_partners")
        .select("*")
        .eq("business_id", profile!.business_id!)
        .order("created_at", { ascending: false });
      return (data || []) as Partner[];
    },
    enabled: !!profile?.business_id,
  });

  const filtered = partners.filter(p => {
    if (filterType !== "all" && p.partner_type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.partner_name.toLowerCase().includes(q) ||
        (p.company_name || "").toLowerCase().includes(q) ||
        (p.email || "").toLowerCase().includes(q);
    }
    return true;
  });

  const handleSave = async () => {
    if (!form.partner_name.trim()) { toast.error("Partner name is required"); return; }
    const { error } = await supabase.from("crm_partners").insert({
      business_id: profile!.business_id!,
      partner_name: form.partner_name,
      company_name: form.company_name || null,
      partner_type: form.partner_type,
      email: form.email || null,
      phone: form.phone || null,
      specialization: form.specialization || null,
      relationship_status: form.relationship_status,
      notes: form.notes || null,
    } as any);
    if (error) { toast.error("Failed to add partner"); return; }
    toast.success("Partner added");
    setDialogOpen(false);
    setForm({ partner_name: "", company_name: "", partner_type: "broker", email: "", phone: "", specialization: "", relationship_status: "active", notes: "" });
    queryClient.invalidateQueries({ queryKey: ["crm-partners"] });
  };

  const typeGroups = ["broker", "lawyer", "accountant", "developer", "finance", "other"].map(type => ({
    type,
    label: TYPE_LABELS[type],
    count: partners.filter(p => p.partner_type === type).length,
  }));

  return (
    <div className="space-y-6">
      {/* Partner type cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {typeGroups.map(g => (
          <Card
            key={g.type}
            className={`bg-card border-border cursor-pointer transition-colors hover:border-primary/30 ${filterType === g.type ? "border-primary" : ""}`}
            onClick={() => setFilterType(filterType === g.type ? "all" : g.type)}
          >
            <CardContent className="p-3 text-center">
              <p className="text-xl font-bold text-foreground">{g.count}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{g.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search partners..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 bg-card" />
        </div>
        <Button onClick={() => setDialogOpen(true)} size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Add Partner</Button>
      </div>

      <Card className="bg-card border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Referrals</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.partner_name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{p.company_name || "—"}</TableCell>
                <TableCell><Badge variant="outline" className="text-[10px]">{TYPE_LABELS[p.partner_type]}</Badge></TableCell>
                <TableCell className="text-xs space-y-0.5">
                  {p.email && <div className="flex items-center gap-1"><Mail className="h-3 w-3" />{p.email}</div>}
                  {p.phone && <div className="flex items-center gap-1"><Phone className="h-3 w-3" />{p.phone}</div>}
                </TableCell>
                <TableCell>
                  <Badge variant={p.relationship_status === "active" ? "default" : "secondary"} className="text-[10px]">
                    {p.relationship_status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm font-medium">{p.referral_count}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No partners found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Partner</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div><Label className="text-xs">Partner Name *</Label><Input value={form.partner_name} onChange={e => setForm(f => ({ ...f, partner_name: e.target.value }))} /></div>
            <div><Label className="text-xs">Company Name</Label><Input value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} /></div>
            <div>
              <Label className="text-xs">Partner Type</Label>
              <Select value={form.partner_type} onValueChange={v => setForm(f => ({ ...f, partner_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div><Label className="text-xs">Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            </div>
            <div><Label className="text-xs">Specialization</Label><Input value={form.specialization} onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))} /></div>
            <div><Label className="text-xs">Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
            <Button onClick={handleSave} className="w-full">Add Partner</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
