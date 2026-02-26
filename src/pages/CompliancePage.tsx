import { useState } from "react";
import { useCompliance } from "@/hooks/useCompliance";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FileDown, Trash2, Shield } from "lucide-react";

const CompliancePage = () => {
  const { policies, requests, loading, createRequest, updateRequestStatus } = useCompliance();
  const [open, setOpen] = useState(false);
  const [reqType, setReqType] = useState("EXPORT");

  const handleCreate = async () => {
    const ok = await createRequest({ request_type: reqType });
    if (ok) setOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Compliance Center</h1><p className="text-muted-foreground">Privacy, data retention & compliance requests</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Data Request</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Data Request</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <Select value={reqType} onValueChange={setReqType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="EXPORT">Data Export (GDPR)</SelectItem><SelectItem value="DELETE">Data Deletion</SelectItem></SelectContent>
              </Select>
              <Button onClick={handleCreate} className="w-full">Submit Request</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="pt-6 flex items-center gap-4"><Shield className="h-8 w-8 text-primary" /><div><p className="text-sm text-muted-foreground">Retention Policies</p><p className="text-2xl font-bold">{policies.length}</p></div></CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-4"><FileDown className="h-8 w-8 text-accent" /><div><p className="text-sm text-muted-foreground">Export Requests</p><p className="text-2xl font-bold">{requests.filter(r => r.request_type === "EXPORT").length}</p></div></CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-4"><Trash2 className="h-8 w-8 text-destructive" /><div><p className="text-sm text-muted-foreground">Deletion Requests</p><p className="text-2xl font-bold">{requests.filter(r => r.request_type === "DELETE").length}</p></div></CardContent></Card>
      </div>

      <Tabs defaultValue="requests">
        <TabsList><TabsTrigger value="requests">Data Requests</TabsTrigger><TabsTrigger value="policies">Retention Policies</TabsTrigger></TabsList>
        <TabsContent value="requests" className="space-y-3 mt-4">
          {loading ? <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div> :
            requests.length === 0 ? <Card><CardContent className="py-8 text-center text-muted-foreground">No data requests yet.</CardContent></Card> :
            requests.map(r => (
              <Card key={r.id}><CardContent className="flex items-center justify-between py-4">
                <div>
                  <div className="flex items-center gap-2"><Badge variant={r.request_type === "DELETE" ? "destructive" : "default"}>{r.request_type}</Badge></div>
                  <p className="text-sm text-muted-foreground mt-1">{new Date(r.created_at).toLocaleString()}</p>
                </div>
                <Select value={r.status} onValueChange={v => updateRequestStatus(r.id, v)}>
                  <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="PROCESSING">Processing</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent></Card>
            ))
          }
        </TabsContent>
        <TabsContent value="policies" className="space-y-3 mt-4">
          {policies.length === 0 ? <Card><CardContent className="py-8 text-center text-muted-foreground">No retention policies configured.</CardContent></Card> :
            policies.map(p => (
              <Card key={p.id}><CardContent className="py-4">
                <Badge variant="outline" className="mb-2">{p.scope_level}</Badge>
                <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
                  <span>Logs: {p.logs_retention_days}d</span>
                  <span>Analytics: {p.analytics_retention_days}d</span>
                  <span>Tickets: {p.ticket_retention_days}d</span>
                </div>
              </CardContent></Card>
            ))
          }
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompliancePage;
