import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLeads } from "@/hooks/useLeads";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, Plus, Clock, CalendarCheck, PhoneCall, PhoneMissed } from "lucide-react";
import { formatDistanceToNow, format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { toast } from "sonner";

const CALL_RESULTS = [
  { value: "no_answer", label: "No Answer" },
  { value: "call_back_later", label: "Call Back Later" },
  { value: "interested", label: "Interested" },
  { value: "not_interested", label: "Not Interested" },
  { value: "already_has_seo", label: "Already Has SEO" },
  { value: "wrong_number", label: "Wrong Number" },
  { value: "meeting_scheduled", label: "Meeting Scheduled" },
];

const resultColors: Record<string, string> = {
  no_answer: "bg-muted text-muted-foreground",
  call_back_later: "bg-warning/10 text-warning",
  interested: "bg-success/10 text-success",
  not_interested: "bg-destructive/10 text-destructive",
  already_has_seo: "bg-info/10 text-info",
  wrong_number: "bg-muted text-muted-foreground",
  meeting_scheduled: "bg-primary/10 text-primary",
};

interface ColdCall {
  id: string;
  business_name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  location: string | null;
  industry: string | null;
  call_result: string;
  notes: string | null;
  follow_up_date: string | null;
  follow_up_time: string | null;
  follow_up_type: string | null;
  lead_id: string | null;
  created_at: string;
  caller_user_id: string;
}

const ColdCallingPage = () => {
  const { profile } = useAuth();
  const { createLead } = useLeads();
  const [calls, setCalls] = useState<ColdCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [logOpen, setLogOpen] = useState(false);
  const [tab, setTab] = useState("all");
  const [form, setForm] = useState({
    business_name: "", contact_person: "", phone: "", email: "",
    website: "", location: "", industry: "", call_result: "no_answer",
    notes: "", follow_up_date: "", follow_up_time: "", follow_up_type: "call",
    convert_to_lead: false,
  });

  const fetchCalls = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("cold_calls")
      .select("*")
      .eq("business_id", profile.business_id)
      .order("created_at", { ascending: false })
      .limit(500);
    setCalls((data as ColdCall[]) || []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetchCalls(); }, [fetchCalls]);

  const handleLogCall = async () => {
    if (!form.business_name || !profile?.business_id) return;

    let leadId: string | null = null;
    if (form.call_result === "interested" || form.call_result === "meeting_scheduled") {
      const lead = await createLead({
        name: form.contact_person || form.business_name,
        email: form.email || null,
        phone: form.phone || null,
        business_name: form.business_name || null,
        services_needed: null,
        notes: form.notes || null,
        assigned_to_user_id: profile.user_id,
      });
      if (lead) leadId = lead.id;
    }

    const { error } = await supabase.from("cold_calls").insert({
      business_id: profile.business_id,
      caller_user_id: profile.user_id,
      business_name: form.business_name,
      contact_person: form.contact_person || null,
      phone: form.phone || null,
      email: form.email || null,
      website: form.website || null,
      location: form.location || null,
      industry: form.industry || null,
      call_result: form.call_result,
      notes: form.notes || null,
      follow_up_date: form.follow_up_date || null,
      follow_up_time: form.follow_up_time || null,
      follow_up_type: form.follow_up_type || null,
      lead_id: leadId,
    } as any);

    if (error) { toast.error("Failed to log call"); return; }
    toast.success(leadId ? "Call logged & lead created" : "Call logged");
    setForm({
      business_name: "", contact_person: "", phone: "", email: "",
      website: "", location: "", industry: "", call_result: "no_answer",
      notes: "", follow_up_date: "", follow_up_time: "", follow_up_type: "call",
      convert_to_lead: false,
    });
    setLogOpen(false);
    fetchCalls();
  };

  const now = new Date();
  const todayCalls = calls.filter(c => new Date(c.created_at) >= startOfDay(now) && new Date(c.created_at) <= endOfDay(now));
  const weekCalls = calls.filter(c => new Date(c.created_at) >= startOfWeek(now) && new Date(c.created_at) <= endOfWeek(now));
  const monthCalls = calls.filter(c => new Date(c.created_at) >= startOfMonth(now) && new Date(c.created_at) <= endOfMonth(now));

  const displayCalls = tab === "today" ? todayCalls : tab === "week" ? weekCalls : tab === "month" ? monthCalls : calls;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Cold Calling"
        subtitle="Log and track your outbound calls"
        icon={Phone}
        actions={[{ label: "Log Call", icon: Plus, onClick: () => setLogOpen(true) }]}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today" value={todayCalls.length} icon={PhoneCall} gradient="from-primary to-accent" />
        <StatCard label="This Week" value={weekCalls.length} icon={Phone} gradient="from-neon-blue to-info" />
        <StatCard label="This Month" value={monthCalls.length} icon={Phone} gradient="from-neon-green to-success" />
        <StatCard label="Follow-ups" value={calls.filter(c => c.follow_up_date === format(now, "yyyy-MM-dd")).length} icon={CalendarCheck} gradient="from-warning to-neon-orange" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
          ) : displayCalls.length === 0 ? (
            <Card className="rounded-2xl border-0 shadow-elevated">
              <CardContent className="py-12 text-center text-muted-foreground">
                No calls logged yet. Click "Log Call" to get started.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {displayCalls.map(call => (
                <Card key={call.id} className="rounded-2xl border-0 shadow-elevated overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm truncate">{call.business_name}</p>
                          <Badge className={`text-[10px] px-1.5 py-0 border-0 ${resultColors[call.call_result] || ""}`}>
                            {CALL_RESULTS.find(r => r.value === call.call_result)?.label || call.call_result}
                          </Badge>
                        </div>
                        {call.contact_person && <p className="text-xs text-muted-foreground">{call.contact_person}</p>}
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          {call.phone && <span>{call.phone}</span>}
                          {call.location && <span>• {call.location}</span>}
                        </div>
                        {call.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{call.notes}</p>}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(call.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      {call.follow_up_date && (
                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-1 text-xs text-warning font-medium">
                            <Clock className="h-3 w-3" />
                            Follow-up: {call.follow_up_date}
                          </div>
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

      {/* Log Call Dialog */}
      <Dialog open={logOpen} onOpenChange={setLogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Log Cold Call</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Business Name *</Label><Input value={form.business_name} onChange={e => setForm(p => ({ ...p, business_name: e.target.value }))} className="rounded-xl" /></div>
            <div><Label>Contact Person</Label><Input value={form.contact_person} onChange={e => setForm(p => ({ ...p, contact_person: e.target.value }))} className="rounded-xl" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="rounded-xl" /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="rounded-xl" /></div>
            </div>
            <div><Label>Website</Label><Input value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} className="rounded-xl" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Location</Label><Input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} className="rounded-xl" /></div>
              <div><Label>Industry</Label><Input value={form.industry} onChange={e => setForm(p => ({ ...p, industry: e.target.value }))} className="rounded-xl" /></div>
            </div>
            <div>
              <Label>Call Result *</Label>
              <Select value={form.call_result} onValueChange={v => setForm(p => ({ ...p, call_result: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CALL_RESULTS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Call details..." /></div>

            {(form.call_result === "call_back_later" || form.call_result === "meeting_scheduled") && (
              <div className="p-3 rounded-xl bg-muted/50 space-y-3">
                <p className="text-xs font-medium">Follow-up Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Date</Label><Input type="date" value={form.follow_up_date} onChange={e => setForm(p => ({ ...p, follow_up_date: e.target.value }))} className="rounded-xl" /></div>
                  <div><Label>Time</Label><Input type="time" value={form.follow_up_time} onChange={e => setForm(p => ({ ...p, follow_up_time: e.target.value }))} className="rounded-xl" /></div>
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={form.follow_up_type} onValueChange={v => setForm(p => ({ ...p, follow_up_type: v }))}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="call">Call</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {(form.call_result === "interested" || form.call_result === "meeting_scheduled") && (
              <p className="text-xs text-success font-medium">✓ This will automatically create a Lead</p>
            )}

            <Button onClick={handleLogCall} className="w-full rounded-xl">Log Call</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ColdCallingPage;
