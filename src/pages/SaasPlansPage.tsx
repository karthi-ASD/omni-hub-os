import { useState } from "react";
import { useSaasPlans, SaasPlan } from "@/hooks/useSaasPlans";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Package, Users, FolderOpen, HardDrive, Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const SaasPlansPage = () => {
  const { plans, loading, createPlan, updatePlan, deletePlan } = useSaasPlans();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SaasPlan | null>(null);
  const [form, setForm] = useState({
    name: "", slug: "", description: "",
    monthly_price: 0, yearly_price: 0,
    user_limit: 5, project_limit: 10, storage_limit_gb: 1,
    features: "", sort_order: 0,
  });

  const resetForm = () => {
    setForm({ name: "", slug: "", description: "", monthly_price: 0, yearly_price: 0, user_limit: 5, project_limit: 10, storage_limit_gb: 1, features: "", sort_order: 0 });
    setEditing(null);
  };

  const openEdit = (plan: SaasPlan) => {
    setEditing(plan);
    setForm({
      name: plan.name,
      slug: plan.slug,
      description: plan.description || "",
      monthly_price: plan.monthly_price,
      yearly_price: plan.yearly_price,
      user_limit: plan.user_limit,
      project_limit: plan.project_limit,
      storage_limit_gb: plan.storage_limit_gb,
      features: plan.features_json.join(", "),
      sort_order: plan.sort_order,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    const payload: any = {
      name: form.name,
      slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-"),
      description: form.description,
      monthly_price: form.monthly_price,
      yearly_price: form.yearly_price,
      user_limit: form.user_limit,
      project_limit: form.project_limit,
      storage_limit_gb: form.storage_limit_gb,
      features_json: form.features.split(",").map(f => f.trim()).filter(Boolean),
      sort_order: form.sort_order,
    };
    if (editing) {
      await updatePlan(editing.id, payload);
    } else {
      await createPlan(payload);
    }
    setOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">SaaS Plans</h1>
          <p className="text-muted-foreground">Manage pricing plans for your platform</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> New Plan</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? "Edit Plan" : "Create Plan"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Plan Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Slug</Label><Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated" /></div>
              </div>
              <div><Label>Description</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Monthly Price ($)</Label><Input type="number" value={form.monthly_price} onChange={e => setForm({ ...form, monthly_price: Number(e.target.value) })} /></div>
                <div><Label>Yearly Price ($)</Label><Input type="number" value={form.yearly_price} onChange={e => setForm({ ...form, yearly_price: Number(e.target.value) })} /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>User Limit</Label><Input type="number" value={form.user_limit} onChange={e => setForm({ ...form, user_limit: Number(e.target.value) })} /><p className="text-xs text-muted-foreground">-1 = unlimited</p></div>
                <div><Label>Project Limit</Label><Input type="number" value={form.project_limit} onChange={e => setForm({ ...form, project_limit: Number(e.target.value) })} /></div>
                <div><Label>Storage (GB)</Label><Input type="number" value={form.storage_limit_gb} onChange={e => setForm({ ...form, storage_limit_gb: Number(e.target.value) })} /></div>
              </div>
              <div><Label>Features (comma-separated)</Label><Textarea value={form.features} onChange={e => setForm({ ...form, features: e.target.value })} placeholder="CRM, Reports, AI" /></div>
              <div><Label>Sort Order</Label><Input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })} /></div>
              <Button onClick={handleSave} className="w-full">{editing ? "Update Plan" : "Create Plan"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(plan => (
            <Card key={plan.id} className="relative hover:shadow-lg transition-shadow border-2 hover:border-primary/50">
              {!plan.is_active && (
                <Badge variant="secondary" className="absolute top-3 right-3">Inactive</Badge>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">${plan.monthly_price}</span>
                  <span className="text-muted-foreground">/mo</span>
                  <span className="text-sm text-muted-foreground ml-2">(${plan.yearly_price}/yr)</span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{plan.user_limit === -1 ? "Unlimited" : plan.user_limit} Users</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    <span>{plan.project_limit === -1 ? "Unlimited" : plan.project_limit} Projects</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    <span>{plan.storage_limit_gb} GB Storage</span>
                  </div>
                </div>

                <div className="space-y-1">
                  {plan.features_json.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Check className="h-3 w-3 text-green-600" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(plan)}>
                    <Edit className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deletePlan(plan.id)}>
                    <Trash2 className="h-3 w-3 mr-1" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SaasPlansPage;
