import { useState } from "react";
import { useFollowUps } from "@/hooks/useFollowUps";
import { useLeads } from "@/hooks/useLeads";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Phone, Mail, MessageSquare, StickyNote,
  Calendar, MapPin, Clock, CheckCircle, SkipForward,
  Send, Upload, UserPlus, ExternalLink, Headphones,
} from "lucide-react";
import { toast } from "sonner";
import { format, isPast } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type LeadStage = Database["public"]["Enums"]["lead_stage"];

const STAGE_CONFIG: Record<string, { label: string; color: string }> = {
  new: { label: "New", color: "bg-blue-500/10 text-blue-600" },
  contacted: { label: "Contacted", color: "bg-yellow-500/10 text-yellow-600" },
  meeting_booked: { label: "Qualified", color: "bg-purple-500/10 text-purple-600" },
  proposal_requested: { label: "Proposal Sent", color: "bg-orange-500/10 text-orange-600" },
  negotiation: { label: "Negotiation", color: "bg-indigo-500/10 text-indigo-600" },
  won: { label: "Converted", color: "bg-green-500/10 text-green-600" },
  lost: { label: "Lost", color: "bg-red-500/10 text-red-600" },
};

interface Props {
  lead: Lead;
  onBack: () => void;
  onStageChange: (stage: LeadStage) => void;
}

export function ServiceLeadDetail({ lead, onBack, onStageChange }: Props) {
  const { logActivity, getActivities, updateLead } = useLeads();
  const { followUps, createFollowUp, markCompleted, markSkipped, reschedule } = useFollowUps();
  const { profile } = useAuth();
  const [tab, setTab] = useState("summary");
  const [noteOpen, setNoteOpen] = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  const [noteForm, setNoteForm] = useState({ type: "note" as any, summary: "" });
  const [fuForm, setFuForm] = useState({ date: "", time: "", subject: "", type: "call" });

  const customData = (lead as any).custom_data_json || {};
  const leadFollowUps = followUps.filter(f => f.lead_id === lead.id);
  const stage = STAGE_CONFIG[lead.stage] || { label: lead.stage, color: "" };

  const loadActivities = async () => {
    setLoadingActivities(true);
    const data = await getActivities(lead.id);
    setActivities(data);
    setLoadingActivities(false);
  };

  const handleLogActivity = async () => {
    if (!noteForm.summary.trim()) { toast.error("Summary required"); return; }
    await logActivity(lead.id, noteForm.type, noteForm.summary);
    setNoteForm({ type: "note", summary: "" });
    setNoteOpen(false);
    loadActivities();
  };

  const handleCreateFollowUp = async () => {
    if (!fuForm.date) { toast.error("Date required"); return; }
    await createFollowUp({
      lead_id: lead.id,
      subject: fuForm.subject || `Follow-up for ${lead.name}`,
      followup_date: fuForm.date,
      followup_time: fuForm.time || null,
      followup_type: fuForm.type,
    });
    setFuForm({ date: "", time: "", subject: "", type: "call" });
    setFollowUpOpen(false);
  };

  const handleWhatsApp = () => {
    if (!lead.phone) { toast.error("No phone number"); return; }
    const phone = lead.phone.replace(/[^0-9+]/g, "");
    window.open(`https://wa.me/${phone}`, "_blank");
  };

  const handleCall = () => {
    if (!lead.phone) { toast.error("No phone number"); return; }
    window.open(`tel:${lead.phone}`, "_self");
  };

  const handleRequestNextWeb = async () => {
    if (!profile?.business_id) return;
    const { error } = await supabase.from("nextweb_service_requests").insert({
      business_id: profile.business_id,
      request_type: "support",
      subject: `Lead Support: ${lead.name}`,
      description: `Requesting help with lead ${lead.name} (${lead.email})`,
      priority: "medium",
      status: "open",
      created_by: profile.user_id,
      service_category: "crm",
    } as any);
    if (error) { toast.error("Failed to submit request"); return; }
    toast.success("Request submitted to NextWeb");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-foreground">{lead.name}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge className={`text-[10px] ${stage.color}`}>{stage.label}</Badge>
            {(lead as any).priority && <Badge variant="outline" className="text-[10px]">{(lead as any).priority}</Badge>}
            {lead.source && <Badge variant="secondary" className="text-[10px]">{lead.source}</Badge>}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={handleCall} className="gap-1.5 text-xs"><Phone className="h-3 w-3" />Call</Button>
        <Button size="sm" variant="outline" onClick={handleWhatsApp} className="gap-1.5 text-xs"><MessageSquare className="h-3 w-3" />WhatsApp</Button>
        <Button size="sm" variant="outline" onClick={() => setNoteOpen(true)} className="gap-1.5 text-xs"><StickyNote className="h-3 w-3" />Add Note</Button>
        <Button size="sm" variant="outline" onClick={() => setFollowUpOpen(true)} className="gap-1.5 text-xs"><Calendar className="h-3 w-3" />Schedule Follow-up</Button>
        <Select value={lead.stage} onValueChange={(v) => onStageChange(v as LeadStage)}>
          <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(STAGE_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="ghost" onClick={handleRequestNextWeb} className="gap-1.5 text-xs text-muted-foreground ml-auto">
          <Headphones className="h-3 w-3" />Request NextWeb Help
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => { setTab(v); if (v === "activity") loadActivities(); }}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="summary" className="text-xs">Summary</TabsTrigger>
          <TabsTrigger value="activity" className="text-xs">Activity Timeline</TabsTrigger>
          <TabsTrigger value="followups" className="text-xs">Follow-ups</TabsTrigger>
          <TabsTrigger value="notes" className="text-xs">Internal Notes</TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Contact Information</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{lead.email}</div>
                {lead.phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{lead.phone}</div>}
                {lead.suburb && <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-muted-foreground" />{lead.suburb}</div>}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Lead Details</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Source:</span><span>{lead.source || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Property Type:</span><span>{(lead as any).property_type || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Created:</span><span>{format(new Date(lead.created_at), "dd MMM yyyy")}</span></div>
                {lead.last_contacted_at && <div className="flex justify-between"><span className="text-muted-foreground">Last Contact:</span><span>{format(new Date(lead.last_contacted_at), "dd MMM yyyy HH:mm")}</span></div>}
              </CardContent>
            </Card>

            {/* Solar Details */}
            {Object.keys(customData).length > 0 && (
              <Card className="bg-card border-border md:col-span-2">
                <CardHeader className="pb-2"><CardTitle className="text-sm">☀️ Solar Details</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  {customData.monthly_consumption_kwh && (
                    <div><span className="text-muted-foreground text-xs">Monthly Consumption</span><p>{customData.monthly_consumption_kwh} kWh</p></div>
                  )}
                  {customData.roof_type && (
                    <div><span className="text-muted-foreground text-xs">Roof Type</span><p>{customData.roof_type}</p></div>
                  )}
                  {customData.installation_notes && (
                    <div className="col-span-2"><span className="text-muted-foreground text-xs">Installation Notes</span><p>{customData.installation_notes}</p></div>
                  )}
                </CardContent>
              </Card>
            )}

            {lead.notes && (
              <Card className="bg-card border-border md:col-span-2">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
                <CardContent className="text-sm text-muted-foreground">{lead.notes}</CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Activity Timeline */}
        <TabsContent value="activity" className="mt-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              {loadingActivities ? (
                <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
              ) : activities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No activities logged yet</p>
              ) : (
                <div className="space-y-3">
                  {activities.map((act: any) => (
                    <div key={act.id} className="flex gap-3 border-l-2 border-border pl-3 py-1">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{act.type}</Badge>
                          <span className="text-[10px] text-muted-foreground">{format(new Date(act.created_at), "dd MMM yyyy HH:mm")}</span>
                        </div>
                        <p className="text-sm mt-0.5">{act.summary}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Follow-ups */}
        <TabsContent value="followups" className="mt-4">
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setFollowUpOpen(true)} className="gap-1.5 text-xs">
                <Calendar className="h-3 w-3" />Schedule Follow-up
              </Button>
            </div>
            {leadFollowUps.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="p-8 text-center text-sm text-muted-foreground">No follow-ups scheduled</CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {leadFollowUps.map(fu => {
                  const isOverdue = fu.status === "pending" && isPast(new Date(fu.followup_date));
                  return (
                    <Card key={fu.id} className={`bg-card border-border ${isOverdue ? "border-destructive/50" : ""}`}>
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{fu.subject || "Follow-up"}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant={isOverdue ? "destructive" : "outline"} className="text-[10px]">
                              {format(new Date(fu.followup_date), "dd MMM yyyy")}
                              {fu.followup_time ? ` ${fu.followup_time}` : ""}
                            </Badge>
                            <Badge variant="secondary" className="text-[10px]">{fu.status}</Badge>
                            <Badge variant="outline" className="text-[10px]">{fu.followup_type}</Badge>
                          </div>
                        </div>
                        {fu.status === "pending" && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => markCompleted(fu.id)} className="h-7 text-xs gap-1">
                              <CheckCircle className="h-3 w-3" />Done
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => markSkipped(fu.id)} className="h-7 text-xs gap-1">
                              <SkipForward className="h-3 w-3" />Skip
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Internal Notes */}
        <TabsContent value="notes" className="mt-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm font-medium">Internal Notes</p>
                <Button size="sm" variant="outline" onClick={() => setNoteOpen(true)} className="gap-1.5 text-xs">
                  <StickyNote className="h-3 w-3" />Add Note
                </Button>
              </div>
              {activities.filter((a: any) => a.type === "note").length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No internal notes yet. Click "Add Note" to start.</p>
              ) : (
                <div className="space-y-2">
                  {activities.filter((a: any) => a.type === "note").map((a: any) => (
                    <div key={a.id} className="bg-muted/30 rounded p-3">
                      <p className="text-sm">{a.summary}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(a.created_at), "dd MMM yyyy HH:mm")}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Note Dialog */}
      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Log Activity</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div><Label className="text-xs">Type</Label>
              <Select value={noteForm.type} onValueChange={v => setNoteForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Summary *</Label><Textarea value={noteForm.summary} onChange={e => setNoteForm(f => ({ ...f, summary: e.target.value }))} rows={3} /></div>
            <Button onClick={handleLogActivity} className="w-full">Log Activity</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Follow-up Dialog */}
      <Dialog open={followUpOpen} onOpenChange={setFollowUpOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Schedule Follow-up</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div><Label className="text-xs">Subject</Label><Input value={fuForm.subject} onChange={e => setFuForm(f => ({ ...f, subject: e.target.value }))} placeholder={`Follow-up for ${lead.name}`} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Date *</Label><Input type="date" value={fuForm.date} onChange={e => setFuForm(f => ({ ...f, date: e.target.value }))} /></div>
              <div><Label className="text-xs">Time</Label><Input type="time" value={fuForm.time} onChange={e => setFuForm(f => ({ ...f, time: e.target.value }))} /></div>
            </div>
            <div><Label className="text-xs">Type</Label>
              <Select value={fuForm.type} onValueChange={v => setFuForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreateFollowUp} className="w-full">Schedule</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
