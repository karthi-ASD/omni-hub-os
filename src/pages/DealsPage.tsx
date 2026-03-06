import { useState } from "react";
import { useDeals, Deal, DealStage, DEAL_STAGES, STAGE_LABELS } from "@/hooks/useDeals";
import { useCallLogs, CallOutcome } from "@/hooks/useCallLogs";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FolderKanban, List, Plus, Phone, StickyNote, ArrowRight,
  Trophy, XCircle, DollarSign, User, Mail,
} from "lucide-react";
import { format } from "date-fns";
import { DealDetailSheet } from "@/components/deals/DealDetailSheet";

const stageColors: Record<DealStage, string> = {
  new: "bg-blue-500/10 text-blue-600",
  contacted: "bg-cyan-500/10 text-cyan-600",
  meeting_booked: "bg-violet-500/10 text-violet-600",
  needs_analysis: "bg-amber-500/10 text-amber-600",
  proposal_requested: "bg-orange-500/10 text-orange-600",
  negotiation: "bg-pink-500/10 text-pink-600",
  won: "bg-green-500/10 text-green-600",
  lost: "bg-destructive/10 text-destructive",
};

const DealsPage = () => {
  const { deals, loading, createDeal, changeStage, addNote, markWon, markLost } = useDeals();
  const { logCall } = useCallLogs();
  const { profile } = useAuth();
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [createOpen, setCreateOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState<string | null>(null);
  const [callOpen, setCallOpen] = useState<string | null>(null);
  const [stageChangeOpen, setStageChangeOpen] = useState<{ deal: Deal; toStage: DealStage } | null>(null);
  const [wonLostOpen, setWonLostOpen] = useState<{ dealId: string; type: "won" | "lost" } | null>(null);
  const [filter, setFilter] = useState<DealStage | "all">("all");
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Form states
  const [form, setForm] = useState({ deal_name: "", contact_name: "", email: "", phone: "", business_name: "", service_interest: "", estimated_value: "" });
  const [noteText, setNoteText] = useState("");
  const [callForm, setCallForm] = useState<{ outcome: CallOutcome; notes: string }>({ outcome: "spoke", notes: "" });
  const [lostReason, setLostReason] = useState("");

  const openDeals = deals.filter(d => d.status === "open");
  const filteredDeals = filter === "all" ? openDeals : openDeals.filter(d => d.stage === filter);

  const handleCreate = async () => {
    await createDeal({
      deal_name: form.deal_name,
      contact_name: form.contact_name,
      email: form.email,
      phone: form.phone || undefined,
      business_name: form.business_name || undefined,
      service_interest: form.service_interest || undefined,
      estimated_value: form.estimated_value ? Number(form.estimated_value) : undefined,
    });
    setCreateOpen(false);
    setForm({ deal_name: "", contact_name: "", email: "", phone: "", business_name: "", service_interest: "", estimated_value: "" });
  };

  const handleStageChange = async () => {
    if (!stageChangeOpen) return;
    const { deal, toStage } = stageChangeOpen;
    if (toStage === "won" || toStage === "lost") {
      setWonLostOpen({ dealId: deal.id, type: toStage });
      setStageChangeOpen(null);
      return;
    }
    await changeStage(deal.id, deal.stage, toStage);
    setStageChangeOpen(null);
  };

  const handleWonLost = async () => {
    if (!wonLostOpen) return;
    if (wonLostOpen.type === "won") await markWon(wonLostOpen.dealId);
    else await markLost(wonLostOpen.dealId, lostReason);
    setWonLostOpen(null);
    setLostReason("");
  };

  const kanbanStages = DEAL_STAGES.filter(s => s !== "won" && s !== "lost");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FolderKanban className="h-6 w-6" /> Deals Pipeline
          </h1>
          <p className="text-muted-foreground">Manage your sales pipeline</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={view === "kanban" ? "default" : "outline"} size="sm" onClick={() => setView("kanban")}>
            <FolderKanban className="h-4 w-4 mr-1" /> Kanban
          </Button>
          <Button variant={view === "list" ? "default" : "outline"} size="sm" onClick={() => setView("list")}>
            <List className="h-4 w-4 mr-1" /> List
          </Button>
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" /> New Deal
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : view === "kanban" ? (
        /* KANBAN VIEW */
        <div className="flex gap-3 overflow-x-auto pb-4">
          {kanbanStages.map(stage => {
            const stageDeals = openDeals.filter(d => d.stage === stage);
            return (
              <div key={stage} className="min-w-[260px] w-[260px] shrink-0">
                <div className="flex items-center justify-between mb-2 px-1">
                  <Badge className={stageColors[stage]}>{STAGE_LABELS[stage]}</Badge>
                  <span className="text-xs text-muted-foreground">{stageDeals.length}</span>
                </div>
                <div className="space-y-2">
                  {stageDeals.map(deal => (
                    <Card key={deal.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setSelectedDeal(deal); setDetailOpen(true); }}>
                      <CardContent className="p-3 space-y-2" onClick={e => e.stopPropagation()}>
                        <p className="font-medium text-sm truncate cursor-pointer" onClick={() => { setSelectedDeal(deal); setDetailOpen(true); }}>{deal.deal_name}</p>
                        <p className="font-medium text-sm truncate">{deal.deal_name}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" /> {deal.contact_name}
                        </div>
                        {deal.estimated_value && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <DollarSign className="h-3 w-3" /> {Number(deal.estimated_value).toLocaleString()} {deal.currency}
                          </div>
                        )}
                        <div className="flex gap-1 pt-1 flex-wrap">
                          {(
                            <Select onValueChange={(v) => setStageChangeOpen({ deal, toStage: v as DealStage })}>
                              <SelectTrigger className="h-6 text-[10px] w-auto px-2">
                                <ArrowRight className="h-3 w-3" />
                              </SelectTrigger>
                              <SelectContent>
                                {DEAL_STAGES.filter(s => s !== stage).map(s => (
                                  <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCallOpen(deal.id)}>
                            <Phone className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setNoteOpen(deal.id)}>
                            <StickyNote className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {stageDeals.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-6">No deals</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div>
          <div className="flex gap-2 mb-4">
            <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Filter by stage" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {DEAL_STAGES.map(s => <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {filteredDeals.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No deals found</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {filteredDeals.map(deal => (
                <Card key={deal.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setSelectedDeal(deal); setDetailOpen(true); }}>
                  <CardContent className="flex items-center gap-4 py-3 px-4" onClick={e => e.stopPropagation()}>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { setSelectedDeal(deal); setDetailOpen(true); }}>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{deal.deal_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {deal.contact_name} · {deal.email}
                        {deal.estimated_value && ` · $${Number(deal.estimated_value).toLocaleString()}`}
                      </p>
                    </div>
                    <Badge className={stageColors[deal.stage]}>{STAGE_LABELS[deal.stage]}</Badge>
                    <div className="flex gap-1 shrink-0">
                      <Select onValueChange={(v) => setStageChangeOpen({ deal, toStage: v as DealStage })}>
                        <SelectTrigger className="h-7 text-xs w-auto px-2"><ArrowRight className="h-3 w-3" /></SelectTrigger>
                        <SelectContent>
                          {DEAL_STAGES.filter(s => s !== deal.stage).map(s => (
                            <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="sm" onClick={() => setCallOpen(deal.id)}><Phone className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => setNoteOpen(deal.id)}><StickyNote className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => setWonLostOpen({ dealId: deal.id, type: "won" })}><Trophy className="h-4 w-4 text-primary" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => setWonLostOpen({ dealId: deal.id, type: "lost" })}><XCircle className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Won/Lost summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-primary">Won Deals</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{deals.filter(d => d.status === "won").length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-destructive">Lost Deals</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{deals.filter(d => d.status === "lost").length}</p></CardContent>
        </Card>
      </div>

      {/* CREATE DEAL DIALOG */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Deal</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Deal Name *</Label><Input value={form.deal_name} onChange={e => setForm(p => ({ ...p, deal_name: e.target.value }))} /></div>
            <div><Label>Contact Name *</Label><Input value={form.contact_name} onChange={e => setForm(p => ({ ...p, contact_name: e.target.value }))} /></div>
            <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
            <div><Label>Business Name</Label><Input value={form.business_name} onChange={e => setForm(p => ({ ...p, business_name: e.target.value }))} /></div>
            <div><Label>Service Interest</Label><Input value={form.service_interest} onChange={e => setForm(p => ({ ...p, service_interest: e.target.value }))} /></div>
            <div><Label>Estimated Value</Label><Input type="number" value={form.estimated_value} onChange={e => setForm(p => ({ ...p, estimated_value: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.deal_name || !form.contact_name || !form.email}>Create Deal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* STAGE CHANGE CONFIRM */}
      <Dialog open={!!stageChangeOpen} onOpenChange={() => setStageChangeOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Move to {stageChangeOpen && STAGE_LABELS[stageChangeOpen.toStage]}?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will update the deal stage and log the change.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStageChangeOpen(null)}>Cancel</Button>
            <Button onClick={handleStageChange}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* WON/LOST CONFIRM */}
      <Dialog open={!!wonLostOpen} onOpenChange={() => { setWonLostOpen(null); setLostReason(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{wonLostOpen?.type === "won" ? "🎉 Mark as Won?" : "Mark as Lost?"}</DialogTitle>
          </DialogHeader>
          {wonLostOpen?.type === "lost" && (
            <div><Label>Lost Reason</Label><Textarea value={lostReason} onChange={e => setLostReason(e.target.value)} placeholder="Why was this deal lost?" /></div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setWonLostOpen(null); setLostReason(""); }}>Cancel</Button>
            <Button onClick={handleWonLost}>{wonLostOpen?.type === "won" ? "Mark Won" : "Mark Lost"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADD NOTE DIALOG */}
      <Dialog open={!!noteOpen} onOpenChange={() => { setNoteOpen(null); setNoteText(""); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Note</DialogTitle></DialogHeader>
          <Textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Enter note..." />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setNoteOpen(null); setNoteText(""); }}>Cancel</Button>
            <Button onClick={async () => { if (noteOpen) { await addNote(noteOpen, noteText); setNoteOpen(null); setNoteText(""); } }} disabled={!noteText}>Save Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* LOG CALL DIALOG */}
      <Dialog open={!!callOpen} onOpenChange={() => { setCallOpen(null); setCallForm({ outcome: "spoke", notes: "" }); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log Call</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Outcome</Label>
              <Select value={callForm.outcome} onValueChange={v => setCallForm(p => ({ ...p, outcome: v as CallOutcome }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="spoke">Spoke</SelectItem>
                  <SelectItem value="no_answer">No Answer</SelectItem>
                  <SelectItem value="left_voicemail">Left Voicemail</SelectItem>
                  <SelectItem value="follow_up_required">Follow-up Required</SelectItem>
                  <SelectItem value="not_interested">Not Interested</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Notes</Label><Textarea value={callForm.notes} onChange={e => setCallForm(p => ({ ...p, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCallOpen(null); setCallForm({ outcome: "spoke", notes: "" }); }}>Cancel</Button>
            <Button onClick={async () => {
              if (callOpen) {
                await logCall({
                  related_entity_type: "deal",
                  related_entity_id: callOpen,
                  call_type: "outbound",
                  outcome: callForm.outcome,
                  notes: callForm.notes || undefined,
                });
                setCallOpen(null);
                setCallForm({ outcome: "spoke", notes: "" });
              }
            }}>Log Call</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deal Detail Sheet */}
      <DealDetailSheet deal={selectedDeal} open={detailOpen} onOpenChange={setDetailOpen} />
    </div>
  );
};

export default DealsPage;
