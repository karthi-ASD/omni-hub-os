import { useState } from "react";
import { usePaymentGateways } from "@/hooks/usePaymentGateways";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Power, PowerOff, CreditCard, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const gatewayLabels: Record<string, string> = {
  eway: "eWAY",
  stripe: "Stripe",
  razorpay: "Razorpay",
  paypal: "PayPal",
};

const GatewayConfigPage = () => {
  const { gateways, loading, addGateway, toggleGateway } = usePaymentGateways();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ gateway_type: "eway", mode: "tenant" });

  const handleAdd = async () => {
    await addGateway(form);
    setOpen(false);
    setForm({ gateway_type: "eway", mode: "tenant" });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Payment Gateways</h1>
          <p className="text-muted-foreground">Configure payment processing per tenant</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Gateway</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Payment Gateway</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Gateway Provider</Label>
                <Select value={form.gateway_type} onValueChange={(v) => setForm({ ...form, gateway_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eway">eWAY</SelectItem>
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="razorpay">Razorpay</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Mode</Label>
                <Select value={form.mode} onValueChange={(v) => setForm({ ...form, mode: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tenant">Tenant (your own gateway)</SelectItem>
                    <SelectItem value="platform">Platform (NextWeb master)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Card className="border-dashed">
                <CardContent className="py-4 text-sm text-muted-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  API credentials are configured securely via backend secrets. Contact your admin to set up credentials.
                </CardContent>
              </Card>
              <Button onClick={handleAdd} className="w-full">Add Gateway</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : gateways.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No payment gateways configured yet</p>
            <p className="text-sm mt-1">Add a gateway to start processing payments</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gateways.map((gw) => (
                <TableRow key={gw.id}>
                  <TableCell className="font-medium">{gatewayLabels[gw.gateway_type] || gw.gateway_type}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{gw.mode}</Badge></TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={gw.is_active ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-muted text-muted-foreground"}>
                      {gw.is_active ? "Active" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(gw.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => toggleGateway(gw.id, !gw.is_active)}>
                      {gw.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                    </Button>
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

export default GatewayConfigPage;
