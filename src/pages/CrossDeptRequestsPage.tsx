import { useCrossDepartmentRequests } from "@/hooks/useCrossDepartmentRequests";
import { useClientProjects } from "@/hooks/useClientProjects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ArrowRight } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  open: "bg-blue-500/10 text-blue-600",
  acknowledged: "bg-yellow-500/10 text-yellow-600",
  in_progress: "bg-primary/10 text-primary",
  completed: "bg-green-500/10 text-green-600",
  rejected: "bg-destructive/10 text-destructive",
};

const CrossDeptRequestsPage = () => {
  const { requests, loading, create, updateStatus } = useCrossDepartmentRequests();
  const { departments } = useClientProjects();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ request_title: "", request_message: "", from_department_id: "", to_department_id: "" });

  const handleCreate = async () => {
    if (!form.request_title) return;
    await create({
      ...form,
      from_department_id: form.from_department_id || undefined,
      to_department_id: form.to_department_id || undefined,
    });
    setOpen(false);
    setForm({ request_title: "", request_message: "", from_department_id: "", to_department_id: "" });
  };

  const getDeptName = (id: string | null) => departments.find((d: any) => d.id === id)?.name || "—";

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cross-Department Requests</h1>
          <p className="text-muted-foreground">Request help or information from other departments</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> New Request</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Cross-Department Request</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Title *</Label><Input value={form.request_title} onChange={e => setForm({ ...form, request_title: e.target.value })} placeholder="e.g. Need website login credentials" /></div>
              <div><Label>Description</Label><Textarea value={form.request_message} onChange={e => setForm({ ...form, request_message: e.target.value })} /></div>
              <div><Label>From Department</Label>
                <Select value={form.from_department_id} onValueChange={v => setForm({ ...form, from_department_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{departments.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>To Department</Label>
                <Select value={form.to_department_id} onValueChange={v => setForm({ ...form, to_department_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{departments.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={!form.request_title}>Create Request</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {requests.length === 0 && (
          <Card className="glass-card"><CardContent className="py-12 text-center text-muted-foreground">No cross-department requests yet.</CardContent></Card>
        )}
        {requests.map(req => (
          <Card key={req.id} className="glass-card hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold">{req.request_title}</h3>
                  {req.request_message && <p className="text-sm text-muted-foreground mt-1">{req.request_message}</p>}
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span>{getDeptName(req.from_department_id)}</span>
                    <ArrowRight className="h-3 w-3" />
                    <span>{getDeptName(req.to_department_id)}</span>
                    <span>•</span>
                    <span>by {req.requested_by_name}</span>
                    <span>•</span>
                    <span>{format(new Date(req.created_at), "MMM d, yyyy")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusColors[req.status] || ""}>{req.status.replace("_", " ")}</Badge>
                  {req.status !== "completed" && req.status !== "rejected" && (
                    <Select value={req.status} onValueChange={v => updateStatus(req.id, v)}>
                      <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="acknowledged">Acknowledged</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CrossDeptRequestsPage;
