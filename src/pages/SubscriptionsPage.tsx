import { useState } from "react";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useSaasPlans } from "@/hooks/useSaasPlans";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Plus, Ban, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  trial: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  suspended: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  cancelled: "bg-destructive/10 text-destructive",
};

const SubscriptionsPage = () => {
  const { subscriptions, loading, createSubscription, updateSubscription, cancelSubscription } = useSubscriptions();
  const { plans } = useSaasPlans();
  const { allBusinesses } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ business_id: "", plan_id: "", billing_cycle: "monthly" });

  const handleCreate = async () => {
    if (!form.business_id || !form.plan_id) return;
    await createSubscription(form);
    setOpen(false);
    setForm({ business_id: "", plan_id: "", billing_cycle: "monthly" });
  };

  const planMap = Object.fromEntries(plans.map(p => [p.id, p]));
  const bizMap = Object.fromEntries(allBusinesses.map(b => [b.id, b]));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Subscriptions</h1>
          <p className="text-muted-foreground">Manage company subscriptions to SaaS plans</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Assign Plan</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Subscription</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Company</Label>
                <Select value={form.business_id} onValueChange={v => setForm({ ...form, business_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                  <SelectContent>
                    {allBusinesses.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Plan</Label>
                <Select value={form.plan_id} onValueChange={v => setForm({ ...form, plan_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
                  <SelectContent>
                    {plans.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name} — ${p.monthly_price}/mo</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Billing Cycle</Label>
                <Select value={form.billing_cycle} onValueChange={v => setForm({ ...form, billing_cycle: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} className="w-full">Create Subscription (14-day trial)</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Revenue cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Subscriptions</p>
            <p className="text-2xl font-bold">{subscriptions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-green-600">{subscriptions.filter(s => s.status === "active").length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Trials</p>
            <p className="text-2xl font-bold text-blue-600">{subscriptions.filter(s => s.status === "trial").length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">MRR (est.)</p>
            <p className="text-2xl font-bold">${subscriptions.filter(s => s.status === "active").reduce((sum, s) => {
              const plan = planMap[s.plan_id];
              return sum + (plan ? (s.billing_cycle === "yearly" ? plan.yearly_price / 12 : plan.monthly_price) : 0);
            }, 0).toFixed(0)}</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : subscriptions.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No subscriptions yet. Assign a plan to a company.</CardContent></Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Cycle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Period End</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map(sub => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">{bizMap[sub.business_id]?.name || sub.business_id.slice(0, 8)}</TableCell>
                  <TableCell>{planMap[sub.plan_id]?.name || "—"}</TableCell>
                  <TableCell className="capitalize">{sub.billing_cycle}</TableCell>
                  <TableCell><Badge className={statusColors[sub.status] || ""} variant="secondary">{sub.status}</Badge></TableCell>
                  <TableCell>{sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {sub.status === "trial" && (
                        <Button size="sm" variant="outline" onClick={() => updateSubscription(sub.id, { status: "active" } as any)}>
                          <RefreshCw className="h-3 w-3 mr-1" /> Activate
                        </Button>
                      )}
                      {(sub.status === "active" || sub.status === "trial") && (
                        <Button size="sm" variant="destructive" onClick={() => cancelSubscription(sub.id)}>
                          <Ban className="h-3 w-3 mr-1" /> Cancel
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default SubscriptionsPage;
