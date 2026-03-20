import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Smartphone, Home, Star, FileText, Bell, Calendar, HelpCircle, BookOpen, MessageCircle, CalendarClock, CheckCircle, RefreshCw, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const SECTIONS = [
  { key: "home", label: "Investor App Home", icon: Home, description: "Featured content and welcome screen for investors", enabled: true },
  { key: "followups", label: "Upcoming Follow-ups", icon: CalendarClock, description: "Show investors their scheduled follow-ups with confirm/reschedule options", enabled: true },
  { key: "opportunities", label: "Featured Opportunities", icon: Star, description: "Showcase selected properties and investment opportunities", enabled: true },
  { key: "documents", label: "Document Requests", icon: FileText, description: "Allow investors to request and submit documents", enabled: true },
  { key: "status", label: "Investment Status Tracker", icon: Smartphone, description: "Let investors track their deal progress in real-time", enabled: true },
  { key: "announcements", label: "Announcements", icon: Bell, description: "Push announcements and updates to investors", enabled: false },
  { key: "events", label: "Workshops & Events", icon: Calendar, description: "Promote investment workshops, webinars, and meetups", enabled: false },
  { key: "faq", label: "FAQs", icon: HelpCircle, description: "Common questions about the investment process", enabled: true },
  { key: "education", label: "Educational Content", icon: BookOpen, description: "Investor guides, articles, and learning resources", enabled: false },
  { key: "support", label: "Support Prompts", icon: MessageCircle, description: "Quick support access for investor queries", enabled: true },
];

export function MobileAppModule() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [sections, setSections] = useState(SECTIONS);
  const [previewTab, setPreviewTab] = useState("content");
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState("");

  // Fetch follow-up tasks for mobile preview
  const { data: followupTasks = [] } = useQuery({
    queryKey: ["crm-followup-tasks", profile?.business_id],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("crm_tasks")
        .select("*")
        .eq("business_id", profile!.business_id!)
        .not("linked_communication_id", "is", null)
        .gte("due_date", today)
        .neq("status", "completed")
        .order("due_date", { ascending: true })
        .limit(20);
      return data || [];
    },
    enabled: !!profile?.business_id,
  });

  const toggle = (key: string) => {
    setSections(prev => prev.map(s => s.key === key ? { ...s, enabled: !s.enabled } : s));
  };

  const handleConfirm = async (taskId: string) => {
    await supabase.from("crm_tasks").update({ customer_response: "confirmed", updated_at: new Date().toISOString() } as any).eq("id", taskId);
    await supabase.from("crm_followup_responses").insert({ business_id: profile!.business_id!, task_id: taskId, response_type: "confirmed" } as any);
    qc.invalidateQueries({ queryKey: ["crm-followup-tasks"] });
    qc.invalidateQueries({ queryKey: ["crm-tasks"] });
    toast.success("Customer confirmed follow-up");
  };

  const handleReschedule = async (taskId: string) => {
    if (!newDate) { toast.error("Select a date"); return; }
    const task = followupTasks.find((t: any) => t.id === taskId);

    await supabase.from("crm_tasks").update({
      due_date: newDate,
      customer_response: "rescheduled",
      rescheduled_by: "customer",
      updated_at: new Date().toISOString(),
    } as any).eq("id", taskId);

    await supabase.from("crm_followup_responses").insert({
      business_id: profile!.business_id!,
      task_id: taskId,
      response_type: "rescheduled",
      new_date: newDate,
    } as any);

    // Log in communications
    if (task?.linked_investor_id) {
      await supabase.from("crm_communications").insert({
        business_id: profile!.business_id!,
        linked_type: "investor",
        linked_id: task.linked_investor_id,
        channel: "note",
        subject: "Customer Rescheduled Follow-up",
        summary: `Investor rescheduled follow-up from ${task.due_date} to ${newDate} via mobile app`,
        performed_by: "Customer (Mobile App)",
      } as any);
    }

    setRescheduleId(null); setNewDate("");
    qc.invalidateQueries({ queryKey: ["crm-followup-tasks"] });
    qc.invalidateQueries({ queryKey: ["crm-tasks"] });
    qc.invalidateQueries({ queryKey: ["crm-communications"] });
    toast.success("Follow-up rescheduled by customer");
  };

  const RESPONSE_COLORS: Record<string, string> = {
    confirmed: "text-green-500",
    rescheduled: "text-amber-500",
    pending: "text-muted-foreground",
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2"><Smartphone className="h-5 w-5" />Mobile App Content Manager</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage what your investors see in their mobile app experience</p>
      </div>

      <Tabs value={previewTab} onValueChange={setPreviewTab}>
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="content" className="text-xs gap-1.5"><Smartphone className="h-3.5 w-3.5" />Content Sections</TabsTrigger>
          <TabsTrigger value="followups" className="text-xs gap-1.5"><CalendarClock className="h-3.5 w-3.5" />Follow-up Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Card className="bg-card border-border"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-foreground">{sections.filter(s => s.enabled).length}</p><p className="text-[10px] text-muted-foreground">Active Sections</p></CardContent></Card>
            <Card className="bg-card border-border"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-foreground">{sections.length}</p><p className="text-[10px] text-muted-foreground">Total Sections</p></CardContent></Card>
            <Card className="bg-card border-border"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-primary">Live</p><p className="text-[10px] text-muted-foreground">App Status</p></CardContent></Card>
          </div>

          <div className="space-y-3">
            {sections.map(section => {
              const Icon = section.icon;
              return (
                <Card key={section.key} className={`bg-card border-border ${section.enabled ? "border-primary/20" : ""}`}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`p-2.5 rounded-lg ${section.enabled ? "bg-primary/10" : "bg-muted"}`}>
                      <Icon className={`h-5 w-5 ${section.enabled ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{section.label}</p>
                        <Badge variant={section.enabled ? "default" : "secondary"} className="text-[10px]">{section.enabled ? "Active" : "Inactive"}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>
                    </div>
                    <Switch checked={section.enabled} onCheckedChange={() => toggle(section.key)} />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="followups" className="mt-4 space-y-4">
          <Card className="bg-card border-primary/20">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-3">
                📱 <strong>Customer Mobile App Preview</strong> — This is what investors see on their mobile app for upcoming follow-ups.
              </p>
            </CardContent>
          </Card>

          {/* Mobile Preview */}
          <div className="mx-auto max-w-sm border-2 border-border rounded-2xl overflow-hidden bg-card shadow-lg">
            <div className="bg-primary/10 px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold text-foreground">📅 Upcoming Follow-ups</p>
              <p className="text-[10px] text-muted-foreground">Your scheduled consultations</p>
            </div>
            <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto">
              {followupTasks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-xs">No upcoming follow-ups</div>
              )}
              {followupTasks.map((t: any) => (
                <Card key={t.id} className="bg-secondary/30 border-border">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium text-foreground">{t.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {t.due_date ? format(new Date(t.due_date + "T00:00:00"), "EEEE, dd MMMM yyyy") : "TBC"}
                          {t.followup_time && ` at ${t.followup_time}`}
                        </p>
                      </div>
                      {t.customer_response && (
                        <Badge variant="outline" className={`text-[9px] ${RESPONSE_COLORS[t.customer_response] || ""}`}>
                          {t.customer_response === "confirmed" ? "✓ Confirmed" : t.customer_response === "rescheduled" ? "↻ Rescheduled" : "⏳ Pending"}
                        </Badge>
                      )}
                    </div>
                    {(!t.customer_response || t.customer_response === "pending") && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="default" className="flex-1 h-7 text-[11px] gap-1" onClick={() => handleConfirm(t.id)}>
                          <CheckCircle className="h-3 w-3" />Confirm
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 h-7 text-[11px] gap-1" onClick={() => { setRescheduleId(t.id); setNewDate(t.due_date || ""); }}>
                          <RefreshCw className="h-3 w-3" />Reschedule
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Card className="bg-card border-primary/20">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Note:</strong> Changes to mobile app content are managed through your CRM workspace. 
            Content updates will sync automatically to connected investor mobile apps.
          </p>
        </CardContent>
      </Card>

      {/* Reschedule Dialog */}
      <Dialog open={!!rescheduleId} onOpenChange={() => setRescheduleId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Reschedule Follow-up</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <p className="text-xs text-muted-foreground">Select a new preferred date for your consultation.</p>
            <div><Label className="text-xs">New Date</Label><Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} /></div>
            <Button onClick={() => rescheduleId && handleReschedule(rescheduleId)} className="w-full">Request Reschedule</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
