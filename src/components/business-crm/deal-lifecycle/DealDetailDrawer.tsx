import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DealTransparencyTracker } from "../DealTransparencyTracker";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  DollarSign, Calendar, Building2, User, FileText, AlertTriangle,
  CheckCircle, Clock, Briefcase, Save, MapPin,
} from "lucide-react";

interface Props {
  deal: any;
  open: boolean;
  onClose: () => void;
}

const STAGE_COLORS: Record<string, string> = {
  new_qualified: "bg-blue-500", contacted: "bg-cyan-500", qualified: "bg-indigo-500",
  property_shared: "bg-violet-500", shortlisted: "bg-purple-500", eoi_submitted: "bg-pink-500",
  deposit_pending: "bg-amber-500", finance_in_progress: "bg-orange-500",
  contract_issued: "bg-rose-500", settlement: "bg-emerald-500", closed: "bg-green-600",
};

const EOI_STATUSES = ["none", "requested", "submitted", "accepted", "rejected"];
const DEPOSIT_STATUSES = ["pending", "received", "held_in_trust", "refunded"];
const FINANCE_STATUSES = ["not_started", "in_progress", "conditional", "approved", "rejected", "delayed"];
const LEGAL_STATUSES = ["not_started", "in_progress", "completed", "delayed"];
const CONTRACT_STATUSES = ["not_started", "drafted", "issued", "signed", "exchanged"];

export function DealDetailDrawer({ deal, open, onClose }: Props) {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const bid = profile?.business_id;
  const [saving, setSaving] = useState(false);

  const { data: partners = [] } = useQuery({
    queryKey: ["crm-partners", bid],
    queryFn: async () => {
      const { data } = await supabase.from("crm_partners").select("*").eq("business_id", bid!);
      return data || [];
    },
    enabled: !!bid && open,
  });

  const { data: property } = useQuery({
    queryKey: ["deal-property", deal?.property_id],
    queryFn: async () => {
      const { data } = await supabase.from("crm_properties").select("*").eq("id", deal!.property_id).single();
      return data;
    },
    enabled: !!deal?.property_id,
  });

  if (!deal) return null;

  const brokers = partners.filter((p: any) => p.partner_type === "broker");
  const lawyers = partners.filter((p: any) => p.partner_type === "lawyer");
  const accountants = partners.filter((p: any) => p.partner_type === "accountant");
  const developers = partners.filter((p: any) => p.partner_type === "developer");

  const updateDeal = async (updates: Record<string, any>) => {
    setSaving(true);
    await supabase.from("crm_deals").update({
      ...updates,
      updated_at: new Date().toISOString(),
    } as any).eq("id", deal.id);
    qc.invalidateQueries({ queryKey: ["crm-deals"] });
    setSaving(false);
    toast.success("Deal updated");
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg">{deal.deal_name}</SheetTitle>
            <div className="flex items-center gap-2">
              <Badge className={`text-[10px] text-white ${STAGE_COLORS[deal.deal_stage] || "bg-muted"}`}>
                {(deal.deal_stage || "").replace(/_/g, " ")}
              </Badge>
              {deal.risk_rating === "high" && <Badge variant="destructive" className="text-[10px]">High Risk</Badge>}
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {deal.deal_value && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />${Number(deal.deal_value).toLocaleString()}</span>}
            {deal.deal_type && <Badge variant="outline" className="text-[10px]">{deal.deal_type}</Badge>}
            <span>Created {format(new Date(deal.created_at), "dd MMM yyyy")}</span>
          </div>
        </SheetHeader>

        {/* Transparency Tracker */}
        <div className="mt-4">
          <DealTransparencyTracker deal={deal} />
        </div>

        <Tabs defaultValue="lifecycle" className="mt-4">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="lifecycle" className="text-xs">Lifecycle</TabsTrigger>
            <TabsTrigger value="parties" className="text-xs">Parties</TabsTrigger>
            <TabsTrigger value="property" className="text-xs">Property</TabsTrigger>
            <TabsTrigger value="finance" className="text-xs">Finance</TabsTrigger>
          </TabsList>

          {/* Lifecycle Tab */}
          <TabsContent value="lifecycle" className="space-y-3 mt-3">
            {/* EOI */}
            <Card className="bg-card border-border">
              <CardContent className="p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />Expression of Interest (EOI)
                </p>
                <Select value={deal.eoi_status || "none"} onValueChange={v => updateDeal({ eoi_status: v })}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{EOI_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Deposit */}
            <Card className="bg-card border-border">
              <CardContent className="p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5" />Deposit ($1,000 Initial)
                </p>
                <Select value={deal.deposit_status || "pending"} onValueChange={v => updateDeal({ deposit_status: v })}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{DEPOSIT_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Finance */}
            <Card className="bg-card border-border">
              <CardContent className="p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5" />Finance (2–4 Weeks)
                </p>
                <Select value={deal.finance_status || "not_started"} onValueChange={v => updateDeal({ finance_status: v, finance_approved: v === "approved" })}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{FINANCE_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
                {deal.responsible_broker && <p className="text-[10px] text-muted-foreground">Broker: {deal.responsible_broker}</p>}
              </CardContent>
            </Card>

            {/* Legal */}
            <Card className="bg-card border-border">
              <CardContent className="p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />Legal Review
                </p>
                <Select value={deal.legal_status || "not_started"} onValueChange={v => updateDeal({ legal_status: v })}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{LEGAL_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
                {deal.responsible_lawyer && <p className="text-[10px] text-muted-foreground">Lawyer: {deal.responsible_lawyer}</p>}
              </CardContent>
            </Card>

            {/* Contract */}
            <Card className="bg-card border-border">
              <CardContent className="p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />Contract
                </p>
                <Select value={deal.contract_status || "not_started"} onValueChange={v => updateDeal({ contract_status: v })}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{CONTRACT_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
                {deal.responsible_accountant && <p className="text-[10px] text-muted-foreground">Accountant: {deal.responsible_accountant}</p>}
              </CardContent>
            </Card>

            {/* Settlement */}
            <Card className="bg-card border-border">
              <CardContent className="p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />Settlement
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground text-xs">Target Date:</span>
                    <p className="font-medium">{deal.settlement_target_date ? format(new Date(deal.settlement_target_date), "dd MMM yyyy") : "Not set"}</p>
                  </div>
                  <div><span className="text-muted-foreground text-xs">Actual Date:</span>
                    <p className="font-medium">{deal.settlement_date ? format(new Date(deal.settlement_date), "dd MMM yyyy") : "Pending"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Blockers */}
            {(deal.blocker_summary || deal.delay_reason) && (
              <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="p-3 space-y-1">
                  <p className="text-xs font-semibold text-destructive uppercase flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />Blockers & Delays
                  </p>
                  {deal.delay_reason && <p className="text-sm text-destructive">{deal.delay_reason}</p>}
                  {deal.blocker_summary && <p className="text-sm text-muted-foreground">{deal.blocker_summary}</p>}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Third-Party Tracking */}
          <TabsContent value="parties" className="space-y-3 mt-3">
            {/* Broker */}
            <Card className="bg-card border-border">
              <CardContent className="p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Broker (Finance)</p>
                <Select value={deal.broker_id || ""} onValueChange={v => updateDeal({ broker_id: v || null })}>
                  <SelectTrigger className="text-sm"><SelectValue placeholder="Select broker..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {brokers.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.partner_name}{p.company_name ? ` (${p.company_name})` : ""}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input placeholder="Broker name (manual)" value={deal.responsible_broker || ""}
                  onChange={e => updateDeal({ responsible_broker: e.target.value })} className="text-sm" />
              </CardContent>
            </Card>

            {/* Lawyer */}
            <Card className="bg-card border-border">
              <CardContent className="p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Lawyer (Legal)</p>
                <Select value={deal.lawyer_id || ""} onValueChange={v => updateDeal({ lawyer_id: v || null })}>
                  <SelectTrigger className="text-sm"><SelectValue placeholder="Select lawyer..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {lawyers.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.partner_name}{p.company_name ? ` (${p.company_name})` : ""}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input placeholder="Lawyer name (manual)" value={deal.responsible_lawyer || ""}
                  onChange={e => updateDeal({ responsible_lawyer: e.target.value })} className="text-sm" />
              </CardContent>
            </Card>

            {/* Accountant */}
            <Card className="bg-card border-border">
              <CardContent className="p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Accountant (Contract)</p>
                <Select value={deal.accountant_id || ""} onValueChange={v => updateDeal({ accountant_id: v || null })}>
                  <SelectTrigger className="text-sm"><SelectValue placeholder="Select accountant..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {accountants.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.partner_name}{p.company_name ? ` (${p.company_name})` : ""}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input placeholder="Accountant name (manual)" value={deal.responsible_accountant || ""}
                  onChange={e => updateDeal({ responsible_accountant: e.target.value })} className="text-sm" />
              </CardContent>
            </Card>

            {/* Developer / Partner */}
            <Card className="bg-card border-border">
              <CardContent className="p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Developer / Partner</p>
                <Select value={deal.partner_id || ""} onValueChange={v => updateDeal({ partner_id: v || null })}>
                  <SelectTrigger className="text-sm"><SelectValue placeholder="Select developer..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {developers.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.partner_name}{p.company_name ? ` (${p.company_name})` : ""}</SelectItem>)}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Next Action */}
            <Card className="bg-card border-border">
              <CardContent className="p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Next Action Owner</p>
                <Input value={deal.next_action_owner || ""} onChange={e => updateDeal({ next_action_owner: e.target.value })}
                  placeholder="Who needs to act next?" className="text-sm" />
                {deal.pending_actions && (
                  <div className="bg-amber-500/5 border border-amber-500/10 rounded p-2">
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Pending Actions</p>
                    <p className="text-sm">{deal.pending_actions}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Property Tab */}
          <TabsContent value="property" className="space-y-3 mt-3">
            {property ? (
              <>
                <Card className="bg-card border-border">
                  <CardContent className="p-3 space-y-2">
                    <p className="font-semibold text-sm text-foreground">{property.property_name}</p>
                    {property.suburb && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{property.suburb}{property.state ? `, ${property.state}` : ""}</p>}
                    <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                      <div><span className="text-muted-foreground text-xs">Price:</span><p className="font-medium">{property.listing_price ? `$${Number(property.listing_price).toLocaleString()}` : "—"}</p></div>
                      <div><span className="text-muted-foreground text-xs">Yield:</span><p className="font-medium">{property.estimated_yield ? `${property.estimated_yield}%` : "—"}</p></div>
                      <div><span className="text-muted-foreground text-xs">Type:</span><p className="font-medium capitalize">{property.property_type}</p></div>
                      <div><span className="text-muted-foreground text-xs">Status:</span><Badge className={`text-[10px] border ${STATUS_COLORS_PROP[property.availability] || ""}`}>{(property.availability || "").replace(/_/g, " ")}</Badge></div>
                    </div>
                    {property.developer_name && <p className="text-xs text-muted-foreground">Developer: <span className="text-foreground">{property.developer_name}</span></p>}
                  </CardContent>
                </Card>
                {property.listing_price && property.estimated_yield && (
                  <Card className="bg-primary/5 border-primary/10">
                    <CardContent className="p-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">5-Year ROI Projection</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-muted-foreground text-xs">Annual Rental:</span><p className="font-medium">${Math.round((property.listing_price * property.estimated_yield) / 100).toLocaleString()}</p></div>
                        <div><span className="text-muted-foreground text-xs">5yr Growth Value:</span><p className="font-medium">${Math.round(property.listing_price * Math.pow(1 + ((property.estimated_growth || 0) / 100), 5)).toLocaleString()}</p></div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No property linked to this deal</p>
                <p className="text-[10px] text-muted-foreground">Link a property from the Property Inventory</p>
              </div>
            )}
          </TabsContent>

          {/* Finance Tab */}
          <TabsContent value="finance" className="space-y-3 mt-3">
            <Card className="bg-card border-border">
              <CardContent className="p-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground text-xs">Deal Value:</span><p className="text-lg font-bold text-foreground">{deal.deal_value ? `$${Number(deal.deal_value).toLocaleString()}` : "—"}</p></div>
                  <div><span className="text-muted-foreground text-xs">Commission:</span><p className="text-lg font-bold text-primary">{deal.commission_amount ? `$${Number(deal.commission_amount).toLocaleString()}` : "—"}</p></div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Risk Rating</p>
                <Select value={deal.risk_rating || "low"} onValueChange={v => updateDeal({ risk_rating: v })}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            {deal.notes && (
              <Card className="bg-card border-border">
                <CardContent className="p-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{deal.notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

const STATUS_COLORS_PROP: Record<string, string> = {
  available: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  under_offer: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  settled: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  off_market: "bg-purple-500/10 text-purple-500 border-purple-500/30",
  pre_market: "bg-cyan-500/10 text-cyan-500 border-cyan-500/30",
};
