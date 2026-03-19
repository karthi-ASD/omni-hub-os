import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Phone, Mail, MessageSquare, Video, FileText, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const CHANNEL_ICONS: Record<string, React.ElementType> = { call: Phone, email: Mail, sms: MessageSquare, whatsapp: MessageSquare, meeting: Video, note: StickyNote };
const CHANNEL_COLORS: Record<string, string> = { call: "bg-green-500/10 text-green-500", email: "bg-blue-500/10 text-blue-500", sms: "bg-amber-500/10 text-amber-500", whatsapp: "bg-emerald-500/10 text-emerald-500", meeting: "bg-purple-500/10 text-purple-500", note: "bg-zinc-500/10 text-zinc-400" };

export function CommunicationsModule() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterChannel, setFilterChannel] = useState("all");

  const [form, setForm] = useState({ linked_type: "investor", linked_id: "", channel: "call", subject: "", summary: "", outcome: "", next_step: "", performed_by: "" });

  const { data: comms = [] } = useQuery({
    queryKey: ["crm-communications", profile?.business_id],
    queryFn: async () => { const { data } = await supabase.from("crm_communications").select("*").eq("business_id", profile!.business_id!).order("created_at", { ascending: false }).limit(100); return data || []; },
    enabled: !!profile?.business_id,
  });

  const filtered = comms.filter((c: any) => {
    if (filterChannel !== "all" && c.channel !== filterChannel) return false;
    if (search) { const q = search.toLowerCase(); return (c.subject || "").toLowerCase().includes(q) || (c.summary || "").toLowerCase().includes(q); }
    return true;
  });

  const handleSave = async () => {
    if (!form.summary.trim()) { toast.error("Summary required"); return; }
    const { error } = await supabase.from("crm_communications").insert({ business_id: profile!.business_id!, ...form, linked_id: form.linked_id || "00000000-0000-0000-0000-000000000000" } as any);
    if (error) { toast.error("Failed"); console.error(error); return; }
    toast.success("Communication logged"); setOpen(false);
    setForm({ linked_type: "investor", linked_id: "", channel: "call", subject: "", summary: "", outcome: "", next_step: "", performed_by: "" });
    qc.invalidateQueries({ queryKey: ["crm-communications"] });
  };

  const channelCounts = ["call", "email", "sms", "whatsapp", "meeting", "note"].map(ch => ({ channel: ch, count: comms.filter((c: any) => c.channel === ch).length }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {channelCounts.map(cc => {
          const Icon = CHANNEL_ICONS[cc.channel] || MessageSquare;
          return (
            <Card key={cc.channel} className={`bg-card border-border cursor-pointer transition-colors hover:border-primary/30 ${filterChannel === cc.channel ? "border-primary" : ""}`} onClick={() => setFilterChannel(filterChannel === cc.channel ? "all" : cc.channel)}>
              <CardContent className="p-3 text-center"><Icon className={`h-4 w-4 mx-auto mb-1 ${CHANNEL_COLORS[cc.channel]?.split(" ")[1] || "text-muted-foreground"}`} /><p className="text-lg font-bold text-foreground">{cc.count}</p><p className="text-[10px] text-muted-foreground capitalize">{cc.channel}</p></CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search communications..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" /></div>
        <Button onClick={() => setOpen(true)} size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Log Communication</Button>
      </div>

      <div className="space-y-2 max-w-3xl">
        {filtered.map((c: any) => {
          const Icon = CHANNEL_ICONS[c.channel] || MessageSquare;
          return (
            <Card key={c.id} className="bg-card border-border">
              <CardContent className="p-3 flex items-start gap-3">
                <div className={`p-2 rounded-lg ${CHANNEL_COLORS[c.channel] || "bg-muted"}`}><Icon className="h-4 w-4" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {c.subject && <p className="text-sm font-medium text-foreground">{c.subject}</p>}
                    <Badge variant="outline" className="text-[10px] capitalize">{c.channel}</Badge>
                    <Badge variant="secondary" className="text-[10px]">{c.linked_type}</Badge>
                    {c.action_required && <Badge variant="destructive" className="text-[10px]">Action Required</Badge>}
                  </div>
                  {c.summary && <p className="text-xs text-muted-foreground mt-0.5">{c.summary}</p>}
                  {c.outcome && <p className="text-xs text-foreground mt-1"><span className="text-muted-foreground">Outcome:</span> {c.outcome}</p>}
                  {c.next_step && <p className="text-xs text-foreground"><span className="text-muted-foreground">Next:</span> {c.next_step}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(c.created_at), "dd MMM yyyy, h:mm a")}{c.performed_by && ` • ${c.performed_by}`}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && <div className="text-center py-12 text-muted-foreground">No communications logged</div>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>Log Communication</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Channel</Label><Select value={form.channel} onValueChange={v => setForm(f => ({ ...f, channel: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="call">Call</SelectItem><SelectItem value="email">Email</SelectItem><SelectItem value="sms">SMS</SelectItem><SelectItem value="whatsapp">WhatsApp</SelectItem><SelectItem value="meeting">Meeting</SelectItem><SelectItem value="note">Internal Note</SelectItem></SelectContent></Select></div>
              <div><Label className="text-xs">Related To</Label><Select value={form.linked_type} onValueChange={v => setForm(f => ({ ...f, linked_type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="investor">Investor</SelectItem><SelectItem value="lead">Lead</SelectItem><SelectItem value="deal">Deal</SelectItem><SelectItem value="partner">Partner</SelectItem></SelectContent></Select></div>
            </div>
            <div><Label className="text-xs">Subject</Label><Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} /></div>
            <div><Label className="text-xs">Summary *</Label><Textarea value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} rows={3} /></div>
            <div><Label className="text-xs">Outcome</Label><Input value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))} /></div>
            <div><Label className="text-xs">Next Step</Label><Input value={form.next_step} onChange={e => setForm(f => ({ ...f, next_step: e.target.value }))} /></div>
            <div><Label className="text-xs">Performed By</Label><Input value={form.performed_by} onChange={e => setForm(f => ({ ...f, performed_by: e.target.value }))} /></div>
            <Button onClick={handleSave} className="w-full">Log Communication</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
