import { usePartners } from "@/hooks/usePartners";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Users, DollarSign, TrendingUp, UserPlus, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";

const PartnersPage = () => {
  const { partners, commissions, loading, createPartner, updatePartnerStatus, approveCommission } = usePartners();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", partner_type: "affiliate", phone: "", region: "", status: "active" as string, business_id: null as string | null, parent_partner_id: null as string | null });

  const activePartners = partners.filter(p => p.status === "active").length;
  const pendingCommissions = commissions.filter(c => c.status === "pending");
  const totalPending = pendingCommissions.reduce((s, c) => s + Number(c.amount), 0);
  const totalPaid = commissions.filter(c => c.status === "paid").reduce((s, c) => s + Number(c.amount), 0);

  const handleCreate = async () => {
    const ok = await createPartner(form);
    if (ok) { setOpen(false); setForm({ name: "", email: "", partner_type: "affiliate", phone: "", region: "", status: "active", business_id: null, parent_partner_id: null }); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Partners</h1>
          <p className="text-muted-foreground">Manage franchise, reseller, and affiliate partners</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><UserPlus className="mr-2 h-4 w-4" />Add Partner</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Partner</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><Label>Email</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div><Label>Type</Label>
                <Select value={form.partner_type} onValueChange={v => setForm(f => ({ ...f, partner_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="franchise">Franchise</SelectItem>
                    <SelectItem value="reseller">Reseller</SelectItem>
                    <SelectItem value="affiliate">Affiliate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Region</Label><Input value={form.region || ""} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} /></div>
              <div><Label>Phone</Label><Input value={form.phone || ""} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
              <Button onClick={handleCreate} className="w-full">Create Partner</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-3"><Users className="h-5 w-5 text-primary" /><div><p className="text-2xl font-bold">{partners.length}</p><p className="text-xs text-muted-foreground">Total Partners</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-3"><TrendingUp className="h-5 w-5 text-green-500" /><div><p className="text-2xl font-bold">{activePartners}</p><p className="text-xs text-muted-foreground">Active</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-3"><DollarSign className="h-5 w-5 text-amber-500" /><div><p className="text-2xl font-bold">${totalPending.toLocaleString()}</p><p className="text-xs text-muted-foreground">Pending Commissions</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-3"><DollarSign className="h-5 w-5 text-emerald-500" /><div><p className="text-2xl font-bold">${totalPaid.toLocaleString()}</p><p className="text-xs text-muted-foreground">Total Paid</p></div></div></CardContent></Card>
          </div>

          <Tabs defaultValue="partners">
            <TabsList><TabsTrigger value="partners">Partners</TabsTrigger><TabsTrigger value="commissions">Commissions ({pendingCommissions.length} pending)</TabsTrigger></TabsList>
            <TabsContent value="partners">
              <Card>
                <Table>
                  <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Email</TableHead><TableHead>Region</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {partners.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell><Badge variant="outline" className="capitalize">{p.partner_type}</Badge></TableCell>
                        <TableCell>{p.email}</TableCell>
                        <TableCell>{p.region || "—"}</TableCell>
                        <TableCell><Badge variant={p.status === "active" ? "default" : "secondary"}>{p.status}</Badge></TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" onClick={() => updatePartnerStatus(p.id, p.status === "active" ? "inactive" : "active")}>
                            {p.status === "active" ? "Deactivate" : "Activate"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {partners.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No partners yet</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
            <TabsContent value="commissions">
              <Card>
                <Table>
                  <TableHeader><TableRow><TableHead>Partner</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {commissions.map(c => {
                      const partner = partners.find(p => p.id === c.partner_id);
                      return (
                        <TableRow key={c.id}>
                          <TableCell>{partner?.name || c.partner_id.slice(0, 8)}</TableCell>
                          <TableCell className="font-medium">${Number(c.amount).toLocaleString()}</TableCell>
                          <TableCell><Badge variant={c.status === "paid" ? "default" : c.status === "approved" ? "secondary" : "outline"}>{c.status}</Badge></TableCell>
                          <TableCell>{new Date(c.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {c.status === "pending" && user && (
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" onClick={() => approveCommission(c.id, user.id)}><CheckCircle className="h-4 w-4 text-green-500" /></Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {commissions.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No commissions yet</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default PartnersPage;
