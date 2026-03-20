import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import { Search } from "lucide-react";

const STATUS_OPTIONS = ["all", "pending", "in_progress", "resolved", "closed"];
const PRIORITY_OPTIONS = ["all", "low", "medium", "high", "urgent"];
const CATEGORY_OPTIONS = ["all", "general", "seo", "website", "ads", "crm", "automation"];
const SLA_OPTIONS = ["all", "on_time", "at_risk", "breached"];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  in_progress: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  resolved: "bg-green-500/10 text-green-600 border-green-500/20",
  closed: "bg-muted text-muted-foreground",
};

const SLA_COLORS: Record<string, string> = {
  on_time: "bg-green-500/10 text-green-600",
  at_risk: "bg-yellow-500/10 text-yellow-600",
  breached: "bg-destructive/10 text-destructive",
};

export default function AdminServiceRequests() {
  const { isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [newSla, setNewSla] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  // Filters
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterAssigned, setFilterAssigned] = useState("all");
  const [filterSearch, setFilterSearch] = useState("");

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["admin-nextweb-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nextweb_service_requests" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: isSuperAdmin,
  });

  // Get business names for display
  const { data: businessMap = {} } = useQuery({
    queryKey: ["admin-business-names"],
    queryFn: async () => {
      const { data } = await supabase.from("businesses").select("id, name");
      const map: Record<string, string> = {};
      (data || []).forEach((b: any) => { map[b.id] = b.name; });
      return map;
    },
    enabled: isSuperAdmin,
  });

  // Get staff members for assignment
  const { data: staffMembers = [] } = useQuery({
    queryKey: ["admin-staff-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .not("full_name", "is", null)
        .order("full_name");
      return data || [];
    },
    enabled: isSuperAdmin,
  });

  // Build staff name map
  const staffMap: Record<string, string> = {};
  staffMembers.forEach((s: any) => { staffMap[s.user_id] = s.full_name; });

  const updateRequest = useMutation({
    mutationFn: async () => {
      if (!selectedRequest) return;
      const updates: any = { status: newStatus };
      if (newSla) updates.sla_status = newSla;
      if (newCategory) updates.service_category = newCategory;
      if (adminNotes) updates.notes = adminNotes;
      if (assignedTo && assignedTo !== "unassigned") updates.assigned_to = assignedTo;
      if (assignedTo === "unassigned") updates.assigned_to = null;
      if (newStatus === "resolved" || newStatus === "closed") {
        updates.resolved_at = new Date().toISOString();
        updates.resolution_notes = resolutionNotes;
      }
      const { error } = await supabase
        .from("nextweb_service_requests" as any)
        .update(updates)
        .eq("id", selectedRequest.id);
      if (error) throw error;

      // Log to audit_logs
      await supabase.from("audit_logs").insert({
        business_id: selectedRequest.business_id,
        actor_user_id: (await supabase.auth.getUser()).data.user?.id,
        action_type: "UPDATE_REQUEST",
        entity_type: "nextweb_service_request",
        entity_id: selectedRequest.id,
        new_value_json: { status: newStatus, sla_status: newSla, assigned_to: assignedTo },
      });
    },
    onSuccess: () => {
      toast.success("Request updated");
      setSelectedRequest(null);
      queryClient.invalidateQueries({ queryKey: ["admin-nextweb-requests"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!isSuperAdmin) return <Navigate to="/dashboard" replace />;

  // Apply filters
  const filtered = requests.filter((r: any) => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (filterPriority !== "all" && r.priority !== filterPriority) return false;
    if (filterCategory !== "all" && r.service_category !== filterCategory) return false;
    if (filterAssigned === "unassigned" && r.assigned_to) return false;
    if (filterAssigned !== "all" && filterAssigned !== "unassigned" && r.assigned_to !== filterAssigned) return false;
    if (filterSearch && !r.title?.toLowerCase().includes(filterSearch.toLowerCase())) return false;
    return true;
  });

  const statusCounts = STATUS_OPTIONS.slice(1).map(s => ({
    status: s,
    count: requests.filter((r: any) => r.status === s).length,
  }));

  const openDetail = (req: any) => {
    setSelectedRequest(req);
    setNewStatus(req.status);
    setNewSla(req.sla_status || "on_time");
    setNewCategory(req.service_category || "general");
    setResolutionNotes(req.resolution_notes || "");
    setAdminNotes(req.notes || "");
    setAssignedTo(req.assigned_to || "unassigned");
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Service Requests</h1>
        <p className="text-sm text-muted-foreground">Manage all client requests across the platform</p>
      </div>

      {/* Status summary */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {statusCounts.map(s => (
          <Card key={s.status} className="cursor-pointer hover:shadow-sm transition-shadow"
            onClick={() => setFilterStatus(s.status === filterStatus ? "all" : s.status)}>
            <CardContent className="py-3 text-center">
              <p className="text-2xl font-bold">{s.count}</p>
              <p className="text-[10px] text-muted-foreground capitalize">{s.status.replace("_", " ")}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search requests..." value={filterSearch} onChange={e => setFilterSearch(e.target.value)} className="pl-9 h-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s} value={s} className="capitalize">{s === "all" ? "All Status" : s.replace("_"," ")}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>{PRIORITY_OPTIONS.map(p => <SelectItem key={p} value={p} className="capitalize">{p === "all" ? "All Priority" : p}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>{CATEGORY_OPTIONS.map(c => <SelectItem key={c} value={c} className="capitalize">{c === "all" ? "All Categories" : c}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterAssigned} onValueChange={setFilterAssigned}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Assigned To" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignees</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {staffMembers.map((s: any) => (
              <SelectItem key={s.user_id} value={s.user_id} className="text-xs">{s.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Request list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No requests match your filters.</CardContent></Card>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Client</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Priority</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Assigned</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">SLA</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((req: any) => (
                  <tr key={req.id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => openDetail(req)}>
                    <td className="px-4 py-3 text-xs">{(businessMap as any)[req.business_id] || req.business_id?.slice(0,8)}</td>
                    <td className="px-4 py-3 font-medium max-w-[200px] truncate">{req.title}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Badge variant="outline" className="text-[10px] capitalize">{req.service_category || "general"}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-[10px] capitalize">{req.priority}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-[10px] ${STATUS_COLORS[req.status] || ""}`}>{req.status}</Badge>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">
                      {req.assigned_to ? (staffMap[req.assigned_to] || "Assigned") : <span className="italic">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <Badge className={`text-[10px] ${SLA_COLORS[req.sla_status || "on_time"] || ""}`}>
                        {(req.sla_status || "on_time").replace("_"," ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground">
                      {format(new Date(req.created_at), "dd MMM yyyy")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedRequest?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{selectedRequest?.description || "No description"}</p>
            <div className="text-xs text-muted-foreground">
              Client: <span className="font-medium text-foreground">{(businessMap as any)[selectedRequest?.business_id] || "—"}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS_OPTIONS.slice(1).map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace("_"," ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Assign To</label>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select staff..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {staffMembers.map((s: any) => (
                      <SelectItem key={s.user_id} value={s.user_id} className="text-xs">{s.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">SLA Status</label>
                <Select value={newSla} onValueChange={setNewSla}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on_time">On Time</SelectItem>
                    <SelectItem value="at_risk">At Risk</SelectItem>
                    <SelectItem value="breached">Breached</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Service Category</label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.slice(1).map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Admin Notes</label>
              <Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={2} placeholder="Internal notes..." />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Resolution Notes (visible to client)</label>
              <Textarea value={resolutionNotes} onChange={e => setResolutionNotes(e.target.value)} rows={2} placeholder="Resolution details..." />
            </div>

            <Button className="w-full" onClick={() => updateRequest.mutate()} disabled={updateRequest.isPending}>
              {updateRequest.isPending ? "Updating..." : "Update Request"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
