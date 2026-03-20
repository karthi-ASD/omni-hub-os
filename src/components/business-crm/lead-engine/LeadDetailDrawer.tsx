import { useState } from "react";
import { CRMLead, calculateLeadScore } from "./LeadEngineTypes";
import { logActivity as logAI } from "@/lib/activity-logger";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Phone, Mail, MapPin, DollarSign, Clock, UserCheck,
  CheckCircle, XCircle, MessageSquare, Calendar, Zap, Shield,
} from "lucide-react";

interface Props {
  lead: CRMLead | null;
  open: boolean;
  onClose: () => void;
  employees: { id: string; full_name: string }[];
  businessId: string;
}

const TEMP_COLORS: Record<string, string> = {
  hot: "bg-red-500/10 text-red-500 border-red-500/30",
  warm: "bg-orange-500/10 text-orange-500 border-orange-500/30",
  cold: "bg-muted text-muted-foreground border-border",
};

export function LeadDetailDrawer({ lead, open, onClose, employees, businessId }: Props) {
  const qc = useQueryClient();
  const [assigning, setAssigning] = useState(false);

  const { data: activities = [] } = useQuery({
    queryKey: ["lead-activities", lead?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("crm_lead_activities")
        .select("*")
        .eq("lead_id", lead!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!lead?.id,
  });

  if (!lead) return null;

  const temp = lead.lead_temperature || "cold";
  const tempClass = TEMP_COLORS[temp] || TEMP_COLORS.cold;

  const handleAssign = async (employeeId: string) => {
    setAssigning(true);
    await supabase
      .from("crm_leads")
      .update({
        assigned_employee_id: employeeId,
        assigned_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", lead.id);

    await supabase.from("crm_lead_activities").insert({
      business_id: businessId,
      lead_id: lead.id,
      activity_type: "assigned",
      description: `Lead assigned to team member`,
    } as any);

    toast.success("Lead assigned");
    const assignedName = employees.find(e => e.id === employeeId)?.full_name || "team member";
    logAI({ userId: employeeId, userRole: "staff", businessId, module: "leads", actionType: "assign", entityType: "crm_lead", entityId: lead.id, description: `Lead assigned to ${assignedName}` });
    qc.invalidateQueries({ queryKey: ["crm-leads"] });
    setAssigning(false);
  };

  const handleAutoScore = async () => {
    const { score, temperature } = calculateLeadScore(lead);
    await supabase
      .from("crm_leads")
      .update({
        lead_score: score,
        lead_temperature: temperature,
        auto_scored: true,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", lead.id);

    await supabase.from("crm_lead_activities").insert({
      business_id: businessId,
      lead_id: lead.id,
      activity_type: "auto_scored",
      description: `Auto-scored: ${score}/100 (${temperature})`,
    } as any);

    toast.success(`Score: ${score}/100 → ${temperature.toUpperCase()}`);
    qc.invalidateQueries({ queryKey: ["crm-leads"] });
  };

  const handleMarkContacted = async () => {
    await supabase
      .from("crm_leads")
      .update({
        first_contact_at: lead.first_contact_at || new Date().toISOString(),
        last_contact_attempt: new Date().toISOString(),
        contact_attempts: (lead.contact_attempts || 0) + 1,
        stage: lead.stage === "new" ? "contacted" : lead.stage,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", lead.id);

    await supabase.from("crm_lead_activities").insert({
      business_id: businessId,
      lead_id: lead.id,
      activity_type: "contacted",
      description: `Contact attempt #${(lead.contact_attempts || 0) + 1}`,
    } as any);

    toast.success("Marked as contacted");
    qc.invalidateQueries({ queryKey: ["crm-leads"] });
  };

  const handleMarkInvalid = async (reason: string) => {
    await supabase
      .from("crm_leads")
      .update({
        stage: "invalid",
        invalid_reason: reason,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", lead.id);
    toast.success("Marked invalid");
    qc.invalidateQueries({ queryKey: ["crm-leads"] });
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg">{lead.full_name}</SheetTitle>
            <Badge className={`${tempClass} border text-xs`}>
              {temp.toUpperCase()}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {lead.source && <Badge variant="outline" className="text-[10px]">{lead.source}</Badge>}
            {lead.lead_score != null && <Badge variant="secondary" className="text-[10px]">Score: {lead.lead_score}</Badge>}
            <span>Added {format(new Date(lead.created_at), "dd MMM yyyy")}</span>
          </div>
        </SheetHeader>

        <Tabs defaultValue="details" className="mt-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
            <TabsTrigger value="actions" className="text-xs">Actions</TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-3">
            {/* Contact Info */}
            <Card className="bg-card border-border">
              <CardContent className="p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Contact</p>
                <div className="space-y-1.5">
                  {lead.mobile && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{lead.mobile}</span>
                      {lead.phone_verified && <CheckCircle className="h-3 w-3 text-emerald-500" />}
                    </div>
                  )}
                  {lead.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{lead.email}</span>
                      {lead.email_verified && <CheckCircle className="h-3 w-3 text-emerald-500" />}
                    </div>
                  )}
                  {(lead.city || lead.state) && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{[lead.city, lead.state].filter(Boolean).join(", ")}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Qualification */}
            <Card className="bg-card border-border">
              <CardContent className="p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Qualification</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground text-xs">Budget:</span><p className="font-medium">{lead.budget_range || "—"}</p></div>
                  <div><span className="text-muted-foreground text-xs">Timeline:</span><p className="font-medium">{lead.investment_timeline || "—"}</p></div>
                  <div><span className="text-muted-foreground text-xs">Interest:</span><p className="font-medium">{lead.property_interest_type || "—"}</p></div>
                  <div><span className="text-muted-foreground text-xs">Finance:</span><p className="font-medium">{lead.finance_readiness || "—"}</p></div>
                  <div><span className="text-muted-foreground text-xs">Location:</span><p className="font-medium">{lead.location_preference || "—"}</p></div>
                  <div><span className="text-muted-foreground text-xs">SMSF:</span><p className="font-medium">{lead.smsf_interest ? "Yes" : "No"}</p></div>
                </div>
              </CardContent>
            </Card>

            {/* Assignment */}
            <Card className="bg-card border-border">
              <CardContent className="p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Assignment</p>
                <Select
                  value={lead.assigned_employee_id || ""}
                  onValueChange={handleAssign}
                  disabled={assigning}
                >
                  <SelectTrigger className="text-sm"><SelectValue placeholder="Assign to advisor..." /></SelectTrigger>
                  <SelectContent>
                    {employees.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {lead.assigned_at && (
                  <p className="text-[10px] text-muted-foreground">Assigned {format(new Date(lead.assigned_at), "dd MMM yyyy HH:mm")}</p>
                )}
              </CardContent>
            </Card>

            {lead.notes && (
              <Card className="bg-card border-border">
                <CardContent className="p-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="actions" className="space-y-3 mt-3">
            <Button onClick={handleAutoScore} size="sm" className="w-full gap-2" variant="outline">
              <Zap className="h-4 w-4" />Auto-Score Lead
            </Button>
            <Button onClick={handleMarkContacted} size="sm" className="w-full gap-2" variant="outline">
              <Phone className="h-4 w-4" />Mark Contacted
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => handleMarkInvalid("wrong_number")} size="sm" variant="destructive" className="text-xs">
                <XCircle className="h-3.5 w-3.5 mr-1" />Wrong Number
              </Button>
              <Button onClick={() => handleMarkInvalid("not_interested")} size="sm" variant="destructive" className="text-xs">
                <XCircle className="h-3.5 w-3.5 mr-1" />Not Interested
              </Button>
              <Button onClick={() => handleMarkInvalid("duplicate")} size="sm" variant="destructive" className="text-xs">
                <XCircle className="h-3.5 w-3.5 mr-1" />Duplicate
              </Button>
              <Button onClick={() => handleMarkInvalid("spam")} size="sm" variant="destructive" className="text-xs">
                <XCircle className="h-3.5 w-3.5 mr-1" />Spam
              </Button>
            </div>

            {/* SLA Status */}
            <Card className={`border ${lead.sla_breached ? "border-destructive bg-destructive/5" : "border-border bg-card"}`}>
              <CardContent className="p-3 flex items-center gap-2">
                <Shield className={`h-4 w-4 ${lead.sla_breached ? "text-destructive" : "text-emerald-500"}`} />
                <div>
                  <p className="text-sm font-medium">{lead.sla_breached ? "SLA Breached" : "SLA OK"}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Contact attempts: {lead.contact_attempts || 0}
                    {lead.last_contact_attempt && ` • Last: ${format(new Date(lead.last_contact_attempt), "dd MMM HH:mm")}`}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Automation Status */}
            <Card className="bg-card border-border">
              <CardContent className="p-3 space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Automation Status</p>
                <div className="flex items-center gap-3 text-sm">
                  <span className={lead.whatsapp_sent ? "text-emerald-500" : "text-muted-foreground"}>
                    {lead.whatsapp_sent ? "✓" : "○"} WhatsApp
                  </span>
                  <span className={lead.email_sent ? "text-emerald-500" : "text-muted-foreground"}>
                    {lead.email_sent ? "✓" : "○"} Email
                  </span>
                  <span className={lead.phone_verified ? "text-emerald-500" : "text-muted-foreground"}>
                    {lead.phone_verified ? "✓" : "○"} Phone Verified
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="mt-3">
            {activities.length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground">No activity yet</p>
            ) : (
              <div className="space-y-2">
                {activities.map((a: any) => (
                  <div key={a.id} className="flex gap-3 py-2 border-b border-border last:border-0">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm">{a.description}</p>
                      <p className="text-[10px] text-muted-foreground">{format(new Date(a.created_at), "dd MMM yyyy HH:mm")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
