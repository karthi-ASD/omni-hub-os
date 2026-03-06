import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Edit2, Save, X, User, Mail, Phone, MapPin, MessageSquare, Calendar, Briefcase, Globe } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Inquiry = Database["public"]["Tables"]["inquiries"]["Row"];

const statusColors: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-500",
  assigned: "bg-yellow-500/10 text-yellow-500",
  contacted: "bg-purple-500/10 text-purple-500",
  qualified: "bg-green-500/10 text-green-500",
  converted_to_lead: "bg-emerald-500/10 text-emerald-500",
  closed: "bg-muted text-muted-foreground",
  spam: "bg-destructive/10 text-destructive",
};

interface InquiryDetailSheetProps {
  inquiry: Inquiry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InquiryDetailSheet({ inquiry, open, onOpenChange }: InquiryDetailSheetProps) {
  const { isSuperAdmin } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Inquiry>>({});

  useEffect(() => {
    if (inquiry && open) {
      setEditing(false);
      setEditForm({ ...inquiry });
    }
  }, [inquiry, open]);

  if (!inquiry) return null;

  const handleSave = async () => {
    await supabase.from("inquiries").update({
      name: editForm.name,
      email: editForm.email,
      phone: editForm.phone,
      suburb: editForm.suburb,
      message: editForm.message,
      service_interest: editForm.service_interest,
    }).eq("id", inquiry.id);
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
            <SheetTitle className="text-lg">{inquiry.name}</SheetTitle>
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
          <Badge className={`${statusColors[inquiry.status] || ""} text-xs capitalize`}>{inquiry.status.replace(/_/g, " ")}</Badge>
          <Badge variant="outline" className="text-[10px]">{inquiry.source}</Badge>
        </div>

        <Separator className="mb-4" />

        {editing ? (
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={editForm.name || ""} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div><Label>Email</Label><Input value={editForm.email || ""} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} /></div>
            <div><Label>Phone</Label><Input value={editForm.phone || ""} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} /></div>
            <div><Label>Suburb</Label><Input value={editForm.suburb || ""} onChange={e => setEditForm(p => ({ ...p, suburb: e.target.value }))} /></div>
            <div><Label>Service Interest</Label><Input value={editForm.service_interest || ""} onChange={e => setEditForm(p => ({ ...p, service_interest: e.target.value }))} /></div>
            <div><Label>Message</Label><Textarea value={editForm.message || ""} onChange={e => setEditForm(p => ({ ...p, message: e.target.value }))} /></div>
          </div>
        ) : (
          <div className="space-y-0">
            <InfoRow icon={User} label="Name" value={inquiry.name} />
            <InfoRow icon={Mail} label="Email" value={inquiry.email} href={`mailto:${inquiry.email}`} />
            <InfoRow icon={Phone} label="Phone" value={inquiry.phone} href={inquiry.phone ? `tel:${inquiry.phone}` : undefined} />
            <InfoRow icon={MapPin} label="Suburb" value={inquiry.suburb} />
            <InfoRow icon={Briefcase} label="Service Interest" value={inquiry.service_interest} />
            <InfoRow icon={Globe} label="Source" value={inquiry.source} />
            <InfoRow icon={Calendar} label="Created" value={format(new Date(inquiry.created_at), "PPpp")} />
            {inquiry.message && (
              <div className="pt-3">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Message</p>
                <p className="text-sm bg-muted/50 rounded-lg p-3">{inquiry.message}</p>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
