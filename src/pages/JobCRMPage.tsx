import { useTenantCustomers, useJobs, useReviewRequests } from "@/hooks/useJobCRM";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Briefcase, Users, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { format } from "date-fns";

const JobCRMPage = () => {
  const { customers, loading: custLoading, create: createCustomer } = useTenantCustomers();
  const { jobs, loading: jobLoading, create: createJob, updateStatus } = useJobs();
  const { reviews, loading: revLoading, create: createReview } = useReviewRequests();

  const [custOpen, setCustOpen] = useState(false);
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custEmail, setCustEmail] = useState("");

  const [jobOpen, setJobOpen] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [jobCustId, setJobCustId] = useState("");

  const handleCreateCustomer = async () => {
    await createCustomer({ name: custName, phone: custPhone || undefined, email: custEmail || undefined });
    setCustName(""); setCustPhone(""); setCustEmail("");
    setCustOpen(false);
  };

  const handleCreateJob = async () => {
    await createJob({ job_title: jobTitle, description: jobDesc, tenant_customer_id: jobCustId || null });
    setJobTitle(""); setJobDesc(""); setJobCustId("");
    setJobOpen(false);
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "completed": return "default";
      case "in_progress": return "secondary";
      case "cancelled": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Job CRM</h1>
        <p className="text-muted-foreground">Customer jobs, dispatch, scheduling & reviews</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Customers</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{customers.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active Jobs</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{jobs.filter(j => !["completed","cancelled"].includes(j.status)).length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Reviews Sent</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{reviews.length}</div></CardContent></Card>
      </div>

      <Tabs defaultValue="jobs">
        <TabsList>
          <TabsTrigger value="jobs"><Briefcase className="h-4 w-4 mr-1" /> Jobs</TabsTrigger>
          <TabsTrigger value="customers"><Users className="h-4 w-4 mr-1" /> Customers</TabsTrigger>
          <TabsTrigger value="reviews"><Star className="h-4 w-4 mr-1" /> Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs">
          <div className="flex justify-end mb-4">
            <Dialog open={jobOpen} onOpenChange={setJobOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Job</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create Job</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Title</Label><Input value={jobTitle} onChange={e => setJobTitle(e.target.value)} /></div>
                  <div><Label>Description</Label><Textarea value={jobDesc} onChange={e => setJobDesc(e.target.value)} /></div>
                  <div>
                    <Label>Customer</Label>
                    <Select value={jobCustId} onValueChange={setJobCustId}>
                      <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                      <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateJob} className="w-full" disabled={!jobTitle}>Create</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Customer</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {jobLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
                ) : jobs.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No jobs</TableCell></TableRow>
                ) : jobs.map(j => (
                  <TableRow key={j.id}>
                    <TableCell className="font-medium">{j.job_title}</TableCell>
                    <TableCell>{(j as any).tenant_customers?.name ?? "—"}</TableCell>
                    <TableCell><Badge variant={statusColor(j.status)}>{j.status}</Badge></TableCell>
                    <TableCell>
                      {j.status !== "completed" && j.status !== "cancelled" && (
                        <div className="flex gap-1">
                          {j.status === "new" && <Button size="sm" variant="outline" onClick={() => updateStatus(j.id, "confirmed")}>Confirm</Button>}
                          {j.status === "confirmed" && <Button size="sm" variant="outline" onClick={() => updateStatus(j.id, "in_progress")}>Start</Button>}
                          {j.status === "in_progress" && <Button size="sm" onClick={() => updateStatus(j.id, "completed")}>Complete</Button>}
                        </div>
                      )}
                      {j.status === "completed" && j.tenant_customer_id && (
                        <Button size="sm" variant="ghost" onClick={() => createReview(j.tenant_customer_id, j.id)}>
                          <Star className="h-3 w-3 mr-1" /> Request Review
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="customers">
          <div className="flex justify-end mb-4">
            <Dialog open={custOpen} onOpenChange={setCustOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Customer</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Customer</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Name</Label><Input value={custName} onChange={e => setCustName(e.target.value)} /></div>
                  <div><Label>Phone</Label><Input value={custPhone} onChange={e => setCustPhone(e.target.value)} /></div>
                  <div><Label>Email</Label><Input type="email" value={custEmail} onChange={e => setCustEmail(e.target.value)} /></div>
                  <Button onClick={handleCreateCustomer} className="w-full" disabled={!custName}>Add</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Email</TableHead></TableRow></TableHeader>
              <TableBody>
                {custLoading ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
                ) : customers.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No customers</TableCell></TableRow>
                ) : customers.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.phone || "—"}</TableCell>
                    <TableCell>{c.email || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="reviews">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Status</TableHead><TableHead>Sent</TableHead></TableRow></TableHeader>
              <TableBody>
                {revLoading ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
                ) : reviews.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No review requests</TableCell></TableRow>
                ) : reviews.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>{(r as any).tenant_customers?.name ?? "—"}</TableCell>
                    <TableCell><Badge variant="outline">{r.status}</Badge></TableCell>
                    <TableCell>{format(new Date(r.sent_at), "dd MMM yyyy HH:mm")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default JobCRMPage;
