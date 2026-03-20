import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";

const STATUS_OPTIONS = ["pending", "in_progress", "resolved", "closed"];

export default function AdminServiceRequests() {
  const { isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");

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

  const updateRequest = useMutation({
    mutationFn: async () => {
      if (!selectedRequest) return;
      const updates: any = { status: newStatus };
      if (newStatus === "resolved" || newStatus === "closed") {
        updates.resolved_at = new Date().toISOString();
        updates.resolution_notes = resolutionNotes;
      }
      const { error } = await supabase
        .from("nextweb_service_requests" as any)
        .update(updates)
        .eq("id", selectedRequest.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Request updated");
      setSelectedRequest(null);
      queryClient.invalidateQueries({ queryKey: ["admin-nextweb-requests"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!isSuperAdmin) return <div className="p-6">Access denied</div>;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold">Client Service Requests</h1>
      <p className="text-sm text-muted-foreground">Manage requests from all clients across the platform.</p>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        {STATUS_OPTIONS.map(status => {
          const count = requests.filter((r: any) => r.status === status).length;
          return (
            <Card key={status}>
              <CardContent className="py-4 text-center">
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground capitalize">{status.replace("_", " ")}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req: any) => (
            <Card key={req.id} className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => { setSelectedRequest(req); setNewStatus(req.status); setResolutionNotes(req.resolution_notes || ""); }}>
              <CardContent className="py-4 flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <p className="font-medium text-sm">{req.title}</p>
                  {req.description && <p className="text-xs text-muted-foreground line-clamp-2">{req.description}</p>}
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">{req.request_type}</Badge>
                    <Badge variant="outline" className="text-[10px]">{req.priority}</Badge>
                    <span className="text-[10px] text-muted-foreground">{req.business_id?.slice(0, 8)}</span>
                    <span className="text-[10px] text-muted-foreground">{format(new Date(req.created_at), "dd MMM yyyy")}</span>
                  </div>
                </div>
                <Badge variant="secondary" className="shrink-0">{req.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedRequest?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{selectedRequest?.description}</p>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Resolution notes..."
              value={resolutionNotes}
              onChange={e => setResolutionNotes(e.target.value)}
              rows={3}
            />
            <Button className="w-full" onClick={() => updateRequest.mutate()} disabled={updateRequest.isPending}>
              Update Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
