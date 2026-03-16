import { useState } from "react";
import { useLeadConversions } from "@/hooks/useLeadConversions";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Clock, ShieldCheck, Mail, Phone, Building2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  approved: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
};

const LeadConversionApprovalsPage = () => {
  const { requests, loading, approveConversion, rejectConversion } = useLeadConversions();
  const [rejectDialog, setRejectDialog] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [tab, setTab] = useState("pending");

  const filtered = requests.filter(r =>
    tab === "all" ? true : r.request_status === tab
  );

  const handleApprove = async (id: string) => {
    await approveConversion(id);
  };

  const handleReject = async () => {
    if (!rejectDialog || !rejectNotes.trim()) return;
    await rejectConversion(rejectDialog, rejectNotes);
    setRejectDialog(null);
    setRejectNotes("");
  };

  const pendingCount = requests.filter(r => r.request_status === "pending").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Client Conversion Approvals"
        subtitle={`${pendingCount} pending approval${pendingCount !== 1 ? "s" : ""}`}
        icon={ShieldCheck}
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pending">
            <Clock className="h-3.5 w-3.5 mr-1" />
            Pending ({requests.filter(r => r.request_status === "pending").length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            <CheckCircle className="h-3.5 w-3.5 mr-1" />
            Approved ({requests.filter(r => r.request_status === "approved").length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            <XCircle className="h-3.5 w-3.5 mr-1" />
            Rejected ({requests.filter(r => r.request_status === "rejected").length})
          </TabsTrigger>
          <TabsTrigger value="all">All ({requests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card className="rounded-2xl border-0 shadow-elevated">
              <CardContent className="py-12 text-center text-muted-foreground">
                No conversion requests
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((req) => (
                <Card key={req.id} className="rounded-2xl border-0 shadow-elevated overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{req.lead_name}</p>
                          <Badge className={`text-[10px] px-1.5 py-0 border-0 ${statusColors[req.request_status] || ""}`}>
                            {req.request_status}
                          </Badge>
                        </div>

                        {req.lead_business_name && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            {req.lead_business_name}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {req.lead_email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {req.lead_email}
                            </span>
                          )}
                          {req.lead_phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {req.lead_phone}
                            </span>
                          )}
                        </div>

                        {req.lead_services_needed && (
                          <p className="text-xs text-muted-foreground">Services: {req.lead_services_needed}</p>
                        )}

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Requested by: <strong>{req.requester_name}</strong></span>
                          <span>·</span>
                          <span>{formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}</span>
                        </div>

                        {req.decision_notes && (
                          <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2 mt-1">
                            Decision: {req.decision_notes}
                          </p>
                        )}
                      </div>

                      {req.request_status === "pending" && (
                        <div className="flex flex-col gap-2 shrink-0">
                          <Button
                            size="sm"
                            className="text-xs h-8 rounded-xl"
                            onClick={() => handleApprove(req.id)}
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8 rounded-xl text-destructive"
                            onClick={() => setRejectDialog(req.id)}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Conversion Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Reason for rejection *</Label>
              <Textarea
                value={rejectNotes}
                onChange={e => setRejectNotes(e.target.value)}
                placeholder="Explain why this lead should not be converted to a client..."
              />
            </div>
            <Button
              onClick={handleReject}
              className="w-full rounded-xl"
              disabled={!rejectNotes.trim()}
              variant="destructive"
            >
              Confirm Rejection
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeadConversionApprovalsPage;
