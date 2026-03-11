import { useState, useEffect } from "react";
import { CustomFieldRenderer } from "@/components/custom-fields/CustomFieldRenderer";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Edit2, Save, X, User, Mail, Phone, Building2, DollarSign, Calendar, Briefcase } from "lucide-react";
import { format } from "date-fns";
import type { Deal, STAGE_LABELS } from "@/hooks/useDeals";
import { supabase } from "@/integrations/supabase/client";

const stageColors: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-600",
  contacted: "bg-cyan-500/10 text-cyan-600",
  meeting_booked: "bg-violet-500/10 text-violet-600",
  needs_analysis: "bg-amber-500/10 text-amber-600",
  proposal_requested: "bg-orange-500/10 text-orange-600",
  negotiation: "bg-pink-500/10 text-pink-600",
  won: "bg-green-500/10 text-green-600",
  lost: "bg-destructive/10 text-destructive",
};

interface DealDetailSheetProps {
  deal: Deal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DealDetailSheet({ deal, open, onOpenChange }: DealDetailSheetProps) {
  const { isSuperAdmin } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Deal>>({});

  useEffect(() => {
    if (deal && open) {
      setEditing(false);
      setEditForm({ ...deal });
    }
  }, [deal, open]);

  if (!deal) return null;

  const handleSave = async () => {
    await supabase.from("deals").update({
      deal_name: editForm.deal_name,
      contact_name: editForm.contact_name,
      email: editForm.email,
      phone: editForm.phone,
      business_name: editForm.business_name,
      service_interest: editForm.service_interest,
    }).eq("id", deal.id);
    setEditing(false);
    onOpenChange(false);
  };

  const InfoRow = ({ icon: Icon, label, value, href }: { icon: React.ElementType; label: string; value: string | null | undefined; href?: string }) => (
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg">{deal.deal_name}</SheetTitle>
            {isSuperAdmin && !editing && (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}><Edit2 className="h-3.5 w-3.5 mr-1" /> Edit</Button>
            )}
            {editing && (
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => setEditing(false)}><X className="h-3.5 w-3.5" /></Button>
                <Button size="sm" onClick={handleSave}><Save className="h-3.5 w-3.5 mr-1" /> Save</Button>
              </div>
            )}
          </div>
        </SheetHeader>

        <div className="flex items-center gap-2 mb-4">
          <Badge className={`${stageColors[deal.stage] || ""} text-xs capitalize`}>{deal.stage.replace(/_/g, " ")}</Badge>
          <Badge variant="outline" className="text-xs capitalize">{deal.status}</Badge>
        </div>

        <Separator className="mb-4" />

        {editing ? (
          <div className="space-y-3">
            <div><Label>Deal Name</Label><Input value={editForm.deal_name || ""} onChange={e => setEditForm(p => ({ ...p, deal_name: e.target.value }))} /></div>
            <div><Label>Contact Name</Label><Input value={editForm.contact_name || ""} onChange={e => setEditForm(p => ({ ...p, contact_name: e.target.value }))} /></div>
            <div><Label>Email</Label><Input value={editForm.email || ""} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} /></div>
            <div><Label>Phone</Label><Input value={editForm.phone || ""} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} /></div>
            <div><Label>Business</Label><Input value={editForm.business_name || ""} onChange={e => setEditForm(p => ({ ...p, business_name: e.target.value }))} /></div>
            <div><Label>Service Interest</Label><Input value={editForm.service_interest || ""} onChange={e => setEditForm(p => ({ ...p, service_interest: e.target.value }))} /></div>
          </div>
        ) : (
          <div className="space-y-0">
            <InfoRow icon={Briefcase} label="Deal Name" value={deal.deal_name} />
            <InfoRow icon={User} label="Contact" value={deal.contact_name} />
            <InfoRow icon={Mail} label="Email" value={deal.email} href={`mailto:${deal.email}`} />
            <InfoRow icon={Phone} label="Phone" value={deal.phone} href={deal.phone ? `tel:${deal.phone}` : undefined} />
            <InfoRow icon={Building2} label="Business" value={deal.business_name} />
            <InfoRow icon={DollarSign} label="Estimated Value" value={deal.estimated_value ? `$${Number(deal.estimated_value).toLocaleString()} ${deal.currency}` : null} />
            <InfoRow icon={Briefcase} label="Service Interest" value={deal.service_interest} />
            <InfoRow icon={Calendar} label="Created" value={format(new Date(deal.created_at), "PPpp")} />
            {(deal as any).closed_at && <InfoRow icon={Calendar} label="Closed" value={format(new Date((deal as any).closed_at), "PPpp")} />}
            {deal.lost_reason && (
              <div className="pt-3">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Lost Reason</p>
                <p className="text-sm bg-destructive/5 rounded-lg p-3 text-destructive">{deal.lost_reason}</p>
              </div>
            )}
          </div>
          )}
          <CustomFieldRenderer moduleName="deals" recordId={deal.id} readOnly={!editing} />
        </SheetContent>
    </Sheet>
  );
}
