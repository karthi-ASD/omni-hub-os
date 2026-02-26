import { useState } from "react";
import { useBackups } from "@/hooks/useBackups";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Database, HardDrive } from "lucide-react";

const BackupsPage = () => {
  const { jobs, runs, loading, createJob } = useBackups();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ backup_type: "DB_SNAPSHOT", frequency: "DAILY", retention_days: "30" });

  const handleCreate = async () => {
    const ok = await createJob({ backup_type: form.backup_type, frequency: form.frequency, retention_days: Number(form.retention_days) });
    if (ok) { setOpen(false); setForm({ backup_type: "DB_SNAPSHOT", frequency: "DAILY", retention_days: "30" }); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Backups & DR</h1><p className="text-muted-foreground">Disaster recovery & backup management</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Backup Job</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Backup Job</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <Select value={form.backup_type} onValueChange={v => setForm(p => ({ ...p, backup_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="DB_SNAPSHOT">DB Snapshot</SelectItem><SelectItem value="STORAGE_SNAPSHOT">Storage Snapshot</SelectItem></SelectContent>
              </Select>
              <Select value={form.frequency} onValueChange={v => setForm(p => ({ ...p, frequency: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="DAILY">Daily</SelectItem><SelectItem value="WEEKLY">Weekly</SelectItem></SelectContent>
              </Select>
              <Input type="number" placeholder="Retention days" value={form.retention_days} onChange={e => setForm(p => ({ ...p, retention_days: e.target.value }))} />
              <Button onClick={handleCreate} className="w-full">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardContent className="pt-6 flex items-center gap-4"><Database className="h-8 w-8 text-primary" /><div><p className="text-sm text-muted-foreground">Backup Jobs</p><p className="text-2xl font-bold">{jobs.length}</p></div></CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-4"><HardDrive className="h-8 w-8 text-accent" /><div><p className="text-sm text-muted-foreground">Total Runs</p><p className="text-2xl font-bold">{runs.length}</p></div></CardContent></Card>
      </div>

      <Tabs defaultValue="jobs">
        <TabsList><TabsTrigger value="jobs">Jobs</TabsTrigger><TabsTrigger value="runs">Run History</TabsTrigger></TabsList>
        <TabsContent value="jobs" className="space-y-3 mt-4">
          {loading ? <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div> :
            jobs.length === 0 ? <Card><CardContent className="py-8 text-center text-muted-foreground">No backup jobs configured.</CardContent></Card> :
            jobs.map(j => (
              <Card key={j.id}><CardContent className="flex items-center justify-between py-4">
                <div><p className="font-medium">{j.backup_type}</p><p className="text-sm text-muted-foreground">{j.frequency} · Retain {j.retention_days} days</p></div>
                <Badge variant={j.status === "ACTIVE" ? "default" : "secondary"}>{j.status}</Badge>
              </CardContent></Card>
            ))
          }
        </TabsContent>
        <TabsContent value="runs" className="space-y-3 mt-4">
          {runs.length === 0 ? <Card><CardContent className="py-8 text-center text-muted-foreground">No backup runs yet.</CardContent></Card> :
            runs.map(r => (
              <Card key={r.id}><CardContent className="flex items-center justify-between py-4">
                <div><p className="text-sm">{new Date(r.created_at).toLocaleString()}</p>{r.error_message && <p className="text-xs text-destructive">{r.error_message}</p>}</div>
                <Badge variant={r.status === "COMPLETED" ? "default" : r.status === "FAILED" ? "destructive" : "secondary"}>{r.status}</Badge>
              </CardContent></Card>
            ))
          }
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BackupsPage;
