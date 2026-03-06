import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Building2, Users, Plus } from "lucide-react";
import { useCompanyAccounts } from "@/hooks/useCompanyAccounts";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

const healthColors: Record<string, string> = {
  good: "bg-emerald-500/10 text-emerald-600",
  at_risk: "bg-amber-500/10 text-amber-600",
  critical: "bg-destructive/10 text-destructive",
};

const CompanyAccountsPage = () => {
  usePageTitle("Company Accounts");
  const { accounts, loading, create } = useCompanyAccounts();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ company_name: "", industry: "", email: "", phone: "", plan: "Starter" });

  const handleCreate = async () => {
    if (!form.company_name) return;
    await create(form);
    toast({ title: "Company account created" });
    setOpen(false);
    setForm({ company_name: "", industry: "", email: "", phone: "", plan: "Starter" });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Company Accounts</h1>
            <p className="text-xs text-muted-foreground">Manage B2B customer accounts</p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Company Account</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Company Name *</Label><Input value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} /></div>
              <div><Label>Industry</Label><Input value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} /></div>
              <div><Label>Email</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
              <div>
                <Label>Plan</Label>
                <Select value={form.plan} onValueChange={v => setForm(f => ({ ...f, plan: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Starter">Starter</SelectItem>
                    <SelectItem value="Professional">Professional</SelectItem>
                    <SelectItem value="Enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} className="w-full">Create Account</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/50"><CardContent className="p-3 text-center"><p className="text-lg font-bold text-foreground">{accounts.length}</p><p className="text-[10px] text-muted-foreground">Total</p></CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-3 text-center"><p className="text-lg font-bold text-emerald-600">{accounts.filter((a: any) => a.status === "active").length}</p><p className="text-[10px] text-muted-foreground">Active</p></CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-3 text-center"><p className="text-lg font-bold text-destructive">{accounts.filter((a: any) => a.health_status === "critical").length}</p><p className="text-[10px] text-muted-foreground">Critical</p></CardContent></Card>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : accounts.length === 0 ? (
        <Card className="border-border/50"><CardContent className="p-8 text-center"><Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">No company accounts yet</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {accounts.map((c: any) => (
            <Card key={c.id} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{c.company_name}</p>
                    <p className="text-[11px] text-muted-foreground">{c.industry || "—"} · {c.plan}</p>
                  </div>
                  <Badge className={`text-[10px] ${healthColors[c.health_status] || ""} border-0`}>
                    {c.health_status?.replace("_", " ")}
                  </Badge>
                </div>
                {(c.email || c.phone) && (
                  <p className="text-[11px] text-muted-foreground">{c.email} {c.phone ? `· ${c.phone}` : ""}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompanyAccountsPage;
