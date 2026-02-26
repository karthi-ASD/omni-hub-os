import { useState } from "react";
import { useIncidents } from "@/hooks/useIncidents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, AlertTriangle, CheckCircle, Clock } from "lucide-react";

const SEVERITIES = ["SEV1", "SEV2", "SEV3"];
const STATUSES = ["OPEN", "MITIGATING", "RESOLVED"];

const IncidentsPage = () => {
  const { incidents, loading, create, updateStatus } = useIncidents();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ severity: "SEV3", title: "", description: "" });

  const handleCreate = async () => {
    const ok = await create({ severity: form.severity, title: form.title, description: form.description || undefined });
    if (ok) { setOpen(false); setForm({ severity: "SEV3", title: "", description: "" }); }
  };

  const sevColor = (s: string) => s === "SEV1" ? "destructive" : s === "SEV2" ? "default" : "secondary";
  const statusIcon = (s: string) => s === "RESOLVED" ? <CheckCircle className="h-4 w-4 text-accent" /> : s === "MITIGATING" ? <Clock className="h-4 w-4 text-warning" /> : <AlertTriangle className="h-4 w-4 text-destructive" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Incident Center</h1><p className="text-muted-foreground">Manage and track production incidents</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> New Incident</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Report Incident</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <Select value={form.severity} onValueChange={v => setForm(p => ({ ...p, severity: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SEVERITIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="Title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              <Textarea placeholder="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              <Button onClick={handleCreate} disabled={!form.title} className="w-full">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="pt-6 flex items-center gap-4"><AlertTriangle className="h-8 w-8 text-destructive" /><div><p className="text-sm text-muted-foreground">Open</p><p className="text-2xl font-bold">{incidents.filter(i => i.status === "OPEN").length}</p></div></CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-4"><Clock className="h-8 w-8 text-warning" /><div><p className="text-sm text-muted-foreground">Mitigating</p><p className="text-2xl font-bold">{incidents.filter(i => i.status === "MITIGATING").length}</p></div></CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-4"><CheckCircle className="h-8 w-8 text-accent" /><div><p className="text-sm text-muted-foreground">Resolved</p><p className="text-2xl font-bold">{incidents.filter(i => i.status === "RESOLVED").length}</p></div></CardContent></Card>
      </div>

      {loading ? <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div> :
        incidents.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">No incidents recorded.</CardContent></Card> :
        <div className="space-y-3">
          {incidents.map(i => (
            <Card key={i.id}><CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                {statusIcon(i.status)}
                <div>
                  <div className="flex items-center gap-2"><p className="font-medium">{i.title}</p><Badge variant={sevColor(i.severity) as any}>{i.severity}</Badge></div>
                  {i.description && <p className="text-sm text-muted-foreground mt-0.5">{i.description}</p>}
                  <p className="text-xs text-muted-foreground">{new Date(i.started_at).toLocaleString()}</p>
                </div>
              </div>
              <Select value={i.status} onValueChange={v => updateStatus(i.id, v)}>
                <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </CardContent></Card>
          ))}
        </div>
      }
    </div>
  );
};

export default IncidentsPage;
