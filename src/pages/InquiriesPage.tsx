import { useState } from "react";
import { useInquiries } from "@/hooks/useInquiries";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, ArrowRight, MessageSquare, Filter } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";
import { InquiryDetailSheet } from "@/components/inquiries/InquiryDetailSheet";

type InquiryStatus = Database["public"]["Enums"]["inquiry_status"];

const statusColors: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-500",
  assigned: "bg-yellow-500/10 text-yellow-500",
  contacted: "bg-purple-500/10 text-purple-500",
  qualified: "bg-green-500/10 text-green-500",
  converted_to_lead: "bg-emerald-500/10 text-emerald-500",
  closed: "bg-muted text-muted-foreground",
  spam: "bg-destructive/10 text-destructive",
};

const InquiriesPage = () => {
  const { inquiries, loading, createInquiry, updateStatus, convertToLead } = useInquiries();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", suburb: "", message: "", service_interest: "" });
  const [selectedInquiry, setSelectedInquiry] = useState<(typeof inquiries)[0] | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const filtered = inquiries.filter((i) => {
    const matchesSearch = !search || [i.name, i.email, i.phone, i.suburb, i.message].some(f => f?.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "all" || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = async () => {
    if (!form.name || !form.email) return;
    await createInquiry({ name: form.name, email: form.email, phone: form.phone || null, suburb: form.suburb || null, message: form.message || null, service_interest: form.service_interest || null });
    setForm({ name: "", email: "", phone: "", suburb: "", message: "", service_interest: "" });
    setCreateOpen(false);
  };

  const handleConvert = async (inquiry: (typeof inquiries)[0]) => {
    const lead = await convertToLead(inquiry);
    if (lead) navigate("/leads");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><MessageSquare className="h-6 w-6" /> Inquiries</h1>
          <p className="text-muted-foreground">Manage inbound inquiries</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> New Inquiry</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Inquiry</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
              <div><Label>Suburb</Label><Input value={form.suburb} onChange={e => setForm(p => ({ ...p, suburb: e.target.value }))} /></div>
              <div><Label>Service Interest</Label><Input value={form.service_interest} onChange={e => setForm(p => ({ ...p, service_interest: e.target.value }))} /></div>
              <div><Label>Message</Label><Textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} /></div>
              <Button onClick={handleCreate} className="w-full">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search inquiries..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="converted_to_lead">Converted</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="spam">Spam</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No inquiries found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden lg:table-cell">Phone</TableHead>
                  <TableHead className="hidden lg:table-cell">Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((inq) => (
                  <TableRow key={inq.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelectedInquiry(inq); setDetailOpen(true); }}>
                    <TableCell className="font-medium">{inq.name}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{inq.email}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{inq.phone || "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant="outline" className="text-[10px]">{inq.source}</Badge>
                    </TableCell>
                    <TableCell>
                      <Select value={inq.status} onValueChange={(v) => updateStatus(inq.id, v as InquiryStatus)}>
                        <SelectTrigger className="h-7 w-auto border-0 p-0">
                          <Badge className={statusColors[inq.status] || ""}>{inq.status.replace(/_/g, " ")}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {["new", "assigned", "contacted", "qualified", "closed", "spam"].map(s => (
                            <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(inq.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {inq.status !== "converted_to_lead" && (
                          <Button variant="ghost" size="sm" onClick={() => handleConvert(inq)} title="Convert to Lead">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Inquiry Detail Sheet */}
      <InquiryDetailSheet inquiry={selectedInquiry} open={detailOpen} onOpenChange={setDetailOpen} />
    </div>
  );
};

export default InquiriesPage;
