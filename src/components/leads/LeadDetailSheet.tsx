import { useState, useEffect } from "react";
import { CustomFieldRenderer } from "@/components/custom-fields/CustomFieldRenderer";
import { LeadNotesTimeline } from "@/components/leads/LeadNotesTimeline";
import { LeadFollowUpsSection } from "@/components/followups/LeadFollowUpsSection";
import { RequestProposalDialog } from "@/components/deal-room/RequestProposalDialog";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Phone, Mail, Building2, Calendar, Clock, Edit2, Save, X, MessageSquare, User, FileText } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type LeadStage = Database["public"]["Enums"]["lead_stage"];
type LeadActivity = Database["public"]["Tables"]["lead_activities"]["Row"];

const stageColors: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-500",
  contacted: "bg-purple-500/10 text-purple-500",
  meeting_booked: "bg-indigo-500/10 text-indigo-500",
  proposal_requested: "bg-orange-500/10 text-orange-500",
  negotiation: "bg-yellow-500/10 text-yellow-500",
  won: "bg-emerald-500/10 text-emerald-500",
  lost: "bg-destructive/10 text-destructive",
};

interface LeadDetailSheetProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStage: (id: string, stage: LeadStage) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
  onSaveEdit: (id: string, updates: Partial<Lead>) => Promise<void>;
  getActivities: (leadId: string) => Promise<LeadActivity[]>;
}

export function LeadDetailSheet({ lead, open, onOpenChange, onUpdateStage, onArchive, onSaveEdit, getActivities }: LeadDetailSheetProps) {
  const { isSuperAdmin } = useAuth();
  const [editing, setEditing] = useState(false);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Lead>>({});
  const [proposalDialogOpen, setProposalDialogOpen] = useState(false);

  useEffect(() => {
    if (lead && open) {
      setEditing(false);
      setEditForm({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        business_name: lead.business_name,
        services_needed: lead.services_needed,
        notes: lead.notes,
      });
      setLoadingActivities(true);
      getActivities(lead.id).then(data => {
        setActivities(data);
        setLoadingActivities(false);
      });
    }
  }, [lead, open]);

  if (!lead) return null;

  const handleSave = async () => {
    await onSaveEdit(lead.id, editForm);
    setEditing(false);
  };

  const InfoRow = ({ icon: Icon, label, value, href }: { icon: React.ElementType; label: string; value: string | null; href?: string }) => (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
        {href && value ? (
          <a href={href} className="text-sm text-primary font-medium hover:underline break-all">{value}</a>
        ) : (
          <p className="text-sm break-all">{value || "—"}</p>
        )}
      </div>
    </div>
  );

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg">{lead.name}</SheetTitle>
            {isSuperAdmin && !editing && (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
              </Button>
            )}
            {editing && (
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => setEditing(false)}><X className="h-3.5 w-3.5" /></Button>
                <Button size="sm" onClick={handleSave}><Save className="h-3.5 w-3.5 mr-1" /> Save</Button>
              </div>
            )}
          </div>
        </SheetHeader>

        {/* Stage */}
        <div className="flex items-center gap-2 mb-4">
          <Badge className={`${stageColors[lead.stage] || ""} text-xs`}>{lead.stage.replace(/_/g, " ")}</Badge>
          {(isSuperAdmin) && (
            <Select value={lead.stage} onValueChange={(v) => onUpdateStage(lead.id, v as LeadStage)}>
              <SelectTrigger className="h-7 w-auto text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["new", "contacted", "meeting_booked", "proposal_requested", "negotiation", "won", "lost"].map(s => (
                  <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <span className="text-xs text-muted-foreground ml-auto">
            {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
          </span>
        </div>

        {/* Request Proposal Button */}
        <div className="mb-4">
          <Button variant="outline" size="sm" className="w-full" onClick={() => setProposalDialogOpen(true)}>
            <FileText className="h-3.5 w-3.5 mr-1" /> Request Proposal
          </Button>
        </div>

        <Separator className="mb-4" />

        {/* Details */}
        {editing ? (
          <div className="space-y-3 mb-6">
            <div><Label>Name</Label><Input value={editForm.name || ""} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div><Label>Email</Label><Input value={editForm.email || ""} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} /></div>
            <div><Label>Phone</Label><Input value={editForm.phone || ""} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} /></div>
            <div><Label>Business Name</Label><Input value={editForm.business_name || ""} onChange={e => setEditForm(p => ({ ...p, business_name: e.target.value }))} /></div>
            <div><Label>Services Needed</Label><Input value={editForm.services_needed || ""} onChange={e => setEditForm(p => ({ ...p, services_needed: e.target.value }))} /></div>
            <div><Label>Notes</Label><Textarea value={editForm.notes || ""} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} /></div>
          </div>
        ) : (
          <div className="space-y-0 mb-6">
            <InfoRow icon={User} label="Name" value={lead.name} />
            <InfoRow icon={Mail} label="Email" value={lead.email} href={`mailto:${lead.email}`} />
            <InfoRow icon={Phone} label="Phone" value={lead.phone} href={lead.phone ? `tel:${lead.phone}` : undefined} />
            <InfoRow icon={Building2} label="Business" value={lead.business_name} />
            <InfoRow icon={MessageSquare} label="Services Needed" value={lead.services_needed} />
            <InfoRow icon={Calendar} label="Created" value={format(new Date(lead.created_at), "PPpp")} />
            {lead.last_contacted_at && (
              <InfoRow icon={Clock} label="Last Contacted" value={format(new Date(lead.last_contacted_at), "PPpp")} />
            )}
            {lead.notes && (
              <div className="pt-3">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
                <p className="text-sm bg-muted/50 rounded-lg p-3">{lead.notes}</p>
              </div>
            )}
            <CustomFieldRenderer moduleName="leads" recordId={lead.id} readOnly />
          </div>
        )}

        <Separator className="mb-4" />

        {/* Follow-Ups Section */}
        <LeadFollowUpsSection leadId={lead.id} leadName={lead.name} />

        <Separator className="my-4" />

        {/* Internal Conversation Notes */}
        <LeadNotesTimeline leadId={lead.id} />

        <Separator className="my-4" />

        {/* Activity Log */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Activity Log</h3>
          {loadingActivities ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
          ) : activities.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No activities logged yet</p>
          ) : (
            <div className="space-y-2">
              {activities.map(act => (
                <div key={act.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MessageSquare className="h-3 w-3 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] capitalize">{act.type}</Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(act.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs mt-1">{act.summary}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Archive button for super admin */}
        {isSuperAdmin && lead.status === "active" && (
          <>
            <Separator className="my-4" />
            <Button variant="destructive" size="sm" className="w-full" onClick={() => { onArchive(lead.id); onOpenChange(false); }}>
              Archive Lead
            </Button>
          </>
        )}
      </SheetContent>
    </Sheet>

    <RequestProposalDialog
      open={proposalDialogOpen}
      onOpenChange={setProposalDialogOpen}
      leadId={lead.id}
      leadName={lead.name}
      leadServices={lead.services_needed}
    />
    </>
  );
}
