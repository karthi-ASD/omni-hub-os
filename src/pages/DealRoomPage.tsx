import { useState, useMemo } from "react";
import { useProposalRequests, ProposalRequest } from "@/hooks/useProposalRequests";
import { useDealRoomProposals, DealRoomProposal } from "@/hooks/useDealRoomProposals";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  FileText, Eye, Clock, Send, CheckCircle2, XCircle,
  Upload, BarChart3, Target, Inbox, TrendingUp, AlertTriangle, Plus,
} from "lucide-react";
import { format, isPast, parseISO } from "date-fns";
import { toast } from "sonner";
import { ProposalEngagementPanel } from "@/components/deal-room/ProposalEngagementPanel";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/10 text-blue-600",
  viewed: "bg-green-500/10 text-green-600",
  reopened: "bg-amber-500/10 text-amber-600",
  negotiation: "bg-violet-500/10 text-violet-600",
  accepted: "bg-green-600/10 text-green-700",
  rejected: "bg-destructive/10 text-destructive",
  expired: "bg-muted text-muted-foreground",
};

const REQUEST_STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600",
  in_progress: "bg-blue-500/10 text-blue-600",
  completed: "bg-green-500/10 text-green-600",
  cancelled: "bg-muted text-muted-foreground",
};

const DealRoomPage = () => {
  const { profile, isSuperAdmin } = useAuth();
  const { requests, loading: reqLoading, updateStatus: updateReqStatus } = useProposalRequests();
  const {
    proposals, loading: propLoading, createProposal, updateStatus,
    uploadPdf, getSignedUrl,
  } = useDealRoomProposals();

  const [createDialog, setCreateDialog] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<DealRoomProposal | null>(null);
  const [engagementOpen, setEngagementOpen] = useState(false);
  const [form, setForm] = useState({
    proposal_title: "", expiry_date: "", proposal_request_id: "",
    lead_id: "", client_id: "",
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const latestProposals = useMemo(() => proposals.filter(p => p.is_latest), [proposals]);

  const stats = useMemo(() => ({
    total: latestProposals.length,
    sent: latestProposals.filter(p => p.proposal_status === "sent").length,
    viewed: latestProposals.filter(p => ["viewed", "reopened"].includes(p.proposal_status)).length,
    accepted: latestProposals.filter(p => p.proposal_status === "accepted").length,
    pendingRequests: requests.filter(r => r.status === "pending").length,
    expired: latestProposals.filter(p => p.proposal_status === "expired" || (p.expiry_date && isPast(parseISO(p.expiry_date)))).length,
  }), [latestProposals, requests]);

  const handleCreateProposal = async () => {
    if (!form.proposal_title) return;
    await createProposal({
      proposal_title: form.proposal_title,
      expiry_date: form.expiry_date || null,
      proposal_request_id: form.proposal_request_id || null,
      lead_id: form.lead_id || null,
      client_id: form.client_id || null,
    });
    setForm({ proposal_title: "", expiry_date: "", proposal_request_id: "", lead_id: "", client_id: "" });
    setCreateDialog(false);
  };

  const handleUploadPdf = async (proposal: DealRoomProposal) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) await uploadPdf(file, proposal.id);
    };
    input.click();
  };

  const handleSendProposal = async (proposal: DealRoomProposal) => {
    if (!proposal.pdf_file_path) { toast.error("Upload PDF first"); return; }
    await updateStatus(proposal.id, "sent");
    toast.success("Proposal marked as sent");
  };

  const loading = reqLoading || propLoading;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Deal Room"
        subtitle="Proposal tracking, engagement analytics & deal intelligence"
        icon={FileText}
        actions={[{ label: "Create Proposal", icon: Plus, onClick: () => setCreateDialog(true) }]}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <StatCard label="Total Proposals" value={stats.total} icon={FileText} gradient="from-primary to-accent" />
        <StatCard label="Sent" value={stats.sent} icon={Send} gradient="from-blue-500 to-blue-600" />
        <StatCard label="Viewed" value={stats.viewed} icon={Eye} gradient="from-green-500 to-green-600" />
        <StatCard label="Accepted" value={stats.accepted} icon={CheckCircle2} gradient="from-emerald-500 to-emerald-600" />
        <StatCard label="Pending Requests" value={stats.pendingRequests} icon={Inbox} gradient="from-amber-500 to-amber-600" />
        <StatCard label="Expired" value={stats.expired} icon={AlertTriangle} gradient="from-muted-foreground to-muted-foreground" />
      </div>

      <Tabs defaultValue="proposals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="proposals">Proposals</TabsTrigger>
          <TabsTrigger value="requests">Requests ({stats.pendingRequests})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* ── Proposals Tab ── */}
        <TabsContent value="proposals">
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
          ) : latestProposals.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No proposals yet. Create your first proposal.</CardContent></Card>
          ) : (
            <Card className="rounded-xl">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proposal</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {latestProposals.map(p => {
                    const isExpired = p.expiry_date && isPast(parseISO(p.expiry_date));
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{p.proposal_title}</p>
                            <p className="text-[10px] text-muted-foreground">by {p.uploader_name}</p>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="secondary" className="text-[10px]">v{p.proposal_version}</Badge></TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[isExpired ? "expired" : p.proposal_status]}`}>
                            {isExpired ? "expired" : p.proposal_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {p.expiry_date ? format(parseISO(p.expiry_date), "dd MMM yyyy") : "—"}
                        </TableCell>
                        <TableCell className="text-xs">{format(new Date(p.created_at), "dd MMM yyyy")}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {!p.pdf_file_path && (
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleUploadPdf(p)}>
                                <Upload className="h-3 w-3 mr-1" /> PDF
                              </Button>
                            )}
                            {p.pdf_file_path && p.proposal_status === "draft" && (
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleSendProposal(p)}>
                                <Send className="h-3 w-3 mr-1" /> Send
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setSelectedProposal(p); setEngagementOpen(true); }}>
                              <BarChart3 className="h-3 w-3 mr-1" /> Insights
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* ── Requests Tab ── */}
        <TabsContent value="requests">
          {reqLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
          ) : requests.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No proposal requests yet.</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {requests.map(req => (
                <Card key={req.id} className="rounded-xl">
                  <CardContent className="py-4 flex items-center justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{req.client_name}</p>
                      {req.service_details && <p className="text-xs text-muted-foreground">{req.service_details}</p>}
                      {req.budget_range && <p className="text-xs text-muted-foreground">Budget: {req.budget_range}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Requested by {req.requester_name} • {format(new Date(req.created_at), "dd MMM yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] ${REQUEST_STATUS_COLORS[req.status]}`}>{req.status}</Badge>
                      {req.status === "pending" && (
                        <>
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateReqStatus(req.id, "in_progress")}>Start</Button>
                          <Button size="sm" className="h-7 text-xs" onClick={() => {
                            setForm(f => ({ ...f, proposal_title: `Proposal for ${req.client_name}`, proposal_request_id: req.id, lead_id: req.lead_id || "" }));
                            setCreateDialog(true);
                          }}>
                            Create Proposal
                          </Button>
                        </>
                      )}
                      {req.status === "in_progress" && (
                        <Button size="sm" className="h-7 text-xs" onClick={() => updateReqStatus(req.id, "completed")}>Complete</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Analytics Tab ── */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rounded-xl">
              <CardContent className="py-6 text-center">
                <p className="text-3xl font-bold">{stats.total > 0 ? Math.round((stats.viewed / stats.total) * 100) : 0}%</p>
                <p className="text-xs text-muted-foreground">View Rate</p>
              </CardContent>
            </Card>
            <Card className="rounded-xl">
              <CardContent className="py-6 text-center">
                <p className="text-3xl font-bold">{stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0}%</p>
                <p className="text-xs text-muted-foreground">Acceptance Rate</p>
              </CardContent>
            </Card>
            <Card className="rounded-xl">
              <CardContent className="py-6 text-center">
                <p className="text-3xl font-bold">{latestProposals.filter(p => p.proposal_status === "negotiation").length}</p>
                <p className="text-xs text-muted-foreground">In Negotiation</p>
              </CardContent>
            </Card>
            <Card className="rounded-xl">
              <CardContent className="py-6 text-center">
                <p className="text-3xl font-bold">{latestProposals.filter(p => p.proposal_status === "rejected").length}</p>
                <p className="text-xs text-muted-foreground">Rejected</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Proposal Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Proposal</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title *</Label><Input value={form.proposal_title} onChange={e => setForm(f => ({ ...f, proposal_title: e.target.value }))} placeholder="Proposal for…" /></div>
            <div><Label>Expiry Date</Label><Input type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateProposal} disabled={!form.proposal_title}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Engagement Panel */}
      <ProposalEngagementPanel
        proposal={selectedProposal}
        open={engagementOpen}
        onOpenChange={setEngagementOpen}
      />
    </div>
  );
};

export default DealRoomPage;
